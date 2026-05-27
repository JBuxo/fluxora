import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.deps import current_user
from app.db.database import get_session
from app.models import Home, SupplyPoint, ConsumptionRecord, MaxPowerRecord
from app.models.contract import Contract
from app.models.datadis_sync_job import DatadisSyncJob
from app.models.enums import ContractStatus, SyncStatus, SyncType
from app.services.credentials import load_credentials, store_credentials
from app.services.datadis import fetch_all_supply_data
from app.services.forecast import run_forecast
from app.services.weather import assign_weather_location, sync_weather

router = APIRouter(prefix="/datadis", tags=["datadis"])


class SyncRequest(BaseModel):
    nif: str | None = None
    password: str | None = None
    date_from: str | None = None
    date_to: str | None = None


def _parse_datadis_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y/%m/%d").date()
    except ValueError:
        return None


def _background_weather_and_forecast(home_ids: list[uuid.UUID]) -> None:
    from app.db.database import engine
    with Session(engine) as s:
        for home_id in home_ids:
            home = s.get(Home, home_id)
            if not home:
                continue
            if not home.weather_location_id:
                loc = assign_weather_location(home_id, s)
                s.commit()
                if loc:
                    sync_weather(loc.id, s)
            else:
                sync_weather(home.weather_location_id, s)
            run_forecast(home_id, s)


@router.post("/sync")
def sync_all(
    body: SyncRequest,
    background_tasks: BackgroundTasks,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    # Resolve credentials: body takes priority, else use stored
    nif = body.nif
    password = body.password
    if nif and password:
        store_credentials(user_id, nif, password, session)
        session.commit()
    else:
        stored = load_credentials(user_id, session)
        if not stored:
            raise HTTPException(
                status_code=422,
                detail="No Datadis credentials provided or stored. Include nif and password in the request body.",
            )
        nif, password = stored

    now = datetime.now(timezone.utc)

    # Default date range: 23 months back (Datadis rejects exactly 2yr ago)
    date_from = body.date_from
    date_to = body.date_to
    if not date_from:
        from datetime import timedelta
        date_from = (now - timedelta(days=700)).strftime("%Y/%m")
    if not date_to:
        date_to = now.strftime("%Y/%m")

    job = DatadisSyncJob(
        user_id=user_id,
        type=SyncType.consumption,
        status=SyncStatus.running,
        started_at=now,
    )
    session.add(job)
    session.commit()
    session.refresh(job)

    try:
        try:
            supplies = fetch_all_supply_data(nif, password, date_from, date_to)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Datadis sync error: {e}")

        total_inserted = 0
        touched_home_ids: list[uuid.UUID] = []
        created_homes: list[dict] = []

        for supply in supplies:
            cups = supply["cups"].strip()

            # Find existing supply point for this user (across all their homes)
            existing_homes = session.exec(
                select(Home).where(Home.user_id == user_id)
            ).all()
            user_home_ids = [h.id for h in existing_homes]

            sp = None
            if user_home_ids:
                sp = session.exec(
                    select(SupplyPoint).where(
                        SupplyPoint.cups == cups,
                        SupplyPoint.home_id.in_(user_home_ids),
                    )
                ).first()

            cups_address = supply.get("address", "") or cups

            if not sp:
                # Auto-create a home for this CUPS using the CUPS address as name
                home = Home(
                    user_id=user_id,
                    name=cups_address,
                    address=cups_address,
                )
                session.add(home)
                session.flush()

                sp = SupplyPoint(
                    home_id=home.id,
                    cups=cups,
                    address=cups_address,
                    distributor_name=supply.get("distributor", ""),
                )
                session.add(sp)
                session.flush()

                created_homes.append({"id": str(home.id), "name": home.name, "cups": cups})
            else:
                home = session.get(Home, sp.home_id)
                sp.address = cups_address
                sp.distributor_name = supply.get("distributor", sp.distributor_name)
                session.add(sp)
                session.flush()

            if home.id not in touched_home_ids:
                touched_home_ids.append(home.id)

            # Upsert contract
            contract_data = supply.get("contract")
            if contract_data:
                existing_contract = session.exec(
                    select(Contract).where(
                        Contract.supply_point_id == sp.id,
                        Contract.status == ContractStatus.active,
                    )
                ).first()

                start = _parse_datadis_date(contract_data.get("start_date"))
                end = _parse_datadis_date(contract_data.get("end_date"))
                access_fare = contract_data.get("access_fare") or ""

                if existing_contract:
                    existing_contract.code_fare = contract_data.get("code_fare")
                    existing_contract.contracted_powers_kw = contract_data.get("contracted_powers_kw")
                    existing_contract.time_discrimination = contract_data.get("time_discrimination")
                    existing_contract.marketer = contract_data.get("marketer")
                    if start:
                        existing_contract.start_date = start
                    if end:
                        existing_contract.end_date = end
                    session.add(existing_contract)
                else:
                    session.add(Contract(
                        supply_point_id=sp.id,
                        start_date=start or date.today(),
                        end_date=end,
                        tariff_name=access_fare,
                        code_fare=contract_data.get("code_fare"),
                        contracted_powers_kw=contract_data.get("contracted_powers_kw"),
                        time_discrimination=contract_data.get("time_discrimination"),
                        marketer=contract_data.get("marketer"),
                        status=ContractStatus.active,
                    ))

            # Upsert consumption records
            existing_ts = set(
                session.exec(
                    select(ConsumptionRecord.timestamp).where(
                        ConsumptionRecord.supply_point_id == sp.id
                    )
                ).all()
            )
            seen_ts = set(existing_ts)
            new_consumption = []
            for r in supply.get("consumption_records", []):
                if r["timestamp"] not in seen_ts:
                    seen_ts.add(r["timestamp"])
                    new_consumption.append(ConsumptionRecord(
                        supply_point_id=sp.id,
                        timestamp=r["timestamp"],
                        consumption_kwh=r["consumption_kwh"],
                    ))
            for rec in new_consumption:
                session.add(rec)
            total_inserted += len(new_consumption)

            # Upsert max power records
            existing_mp = set(
                session.exec(
                    select(MaxPowerRecord.timestamp, MaxPowerRecord.period).where(
                        MaxPowerRecord.supply_point_id == sp.id
                    )
                ).all()
            )
            seen_mp = set(existing_mp)
            for r in supply.get("max_power_records", []):
                key = (r["timestamp"], r["period"])
                if key not in seen_mp:
                    seen_mp.add(key)
                    session.add(MaxPowerRecord(
                        supply_point_id=sp.id,
                        timestamp=r["timestamp"],
                        max_power_kw=r["max_power_kw"],
                        period=r["period"],
                    ))

            sp.last_synced_at = now
            session.add(sp)

        job.status = SyncStatus.success
        job.finished_at = now
        session.add(job)
        session.commit()

        background_tasks.add_task(_background_weather_and_forecast, touched_home_ids)

        return {
            "job_id": str(job.id),
            "synced_supplies": len(supplies),
            "inserted_records": total_inserted,
            "date_from": date_from,
            "date_to": date_to,
            "forecast_queued": True,
            "homes": created_homes,
        }

    except HTTPException:
        job.status = SyncStatus.failed
        job.finished_at = now
        session.add(job)
        session.commit()
        raise
    except Exception as e:
        job.status = SyncStatus.failed
        job.error_message = str(e)
        job.finished_at = now
        session.add(job)
        session.commit()
        raise HTTPException(status_code=500, detail=str(e))
