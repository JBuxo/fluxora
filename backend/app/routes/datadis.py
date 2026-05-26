import os
import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from dotenv import load_dotenv
from sqlmodel import Session, select

from app.core.deps import current_user
from app.db.database import get_session
from app.models import Home, SupplyPoint, ConsumptionRecord, MaxPowerRecord
from app.models.contract import Contract
from app.models.datadis_sync_job import DatadisSyncJob
from app.models.enums import ContractStatus, SyncStatus, SyncType
from app.services.datadis import fetch_all_supply_data
from app.services.forecast import run_forecast

load_dotenv(".env.local")

router = APIRouter(prefix="/datadis", tags=["datadis"])


def _get_credentials():
    nif = os.getenv("DATADIS_NIF")
    password = os.getenv("DATADIS_PASSWORD")
    if not nif or not password:
        raise HTTPException(status_code=500, detail="Datadis credentials not configured")
    return nif, password


def _parse_datadis_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y/%m/%d").date()
    except ValueError:
        return None


def _run_forecast_task(home_id: uuid.UUID) -> None:
    from app.db.database import engine
    with Session(engine) as bg_session:
        run_forecast(home_id, bg_session)


@router.post("/homes/{home_id}/sync")
def sync_all(
    home_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    date_from: str = Query(None, description="Start month YYYY/MM (default: 2 years ago or last sync)"),
    date_to: str = Query(None, description="End month YYYY/MM (default: current month)"),
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    home = session.get(Home, home_id)
    if not home or home.user_id != user_id:
        raise HTTPException(status_code=404, detail="Home not found")

    job = DatadisSyncJob(
        user_id=user_id,
        type=SyncType.consumption,
        status=SyncStatus.running,
        started_at=datetime.now(timezone.utc),
    )
    session.add(job)
    session.commit()
    session.refresh(job)

    try:
        now = datetime.now(timezone.utc)
        if not date_from:
            existing_sps = session.exec(
                select(SupplyPoint).where(SupplyPoint.home_id == home_id)
            ).all()
            last_synced = min(
                (sp.last_synced_at for sp in existing_sps if sp.last_synced_at), default=None
            )
            if last_synced:
                date_from = last_synced.strftime("%Y/%m")
            else:
                two_years_ago = now.replace(year=now.year - 2)
                date_from = two_years_ago.strftime("%Y/%m")
        if not date_to:
            date_to = now.strftime("%Y/%m")

        nif, password = _get_credentials()

        try:
            supplies = fetch_all_supply_data(nif, password, date_from, date_to)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Datadis sync error: {e}")

        total_inserted = 0

        for supply in supplies:
            cups = supply["cups"].strip()

            sp = session.exec(select(SupplyPoint).where(SupplyPoint.cups == cups)).first()
            if not sp:
                sp = SupplyPoint(
                    home_id=home_id,
                    cups=cups,
                    address=supply.get("address", ""),
                    distributor_name=supply.get("distributor", ""),
                )
                session.add(sp)
                session.flush()
            else:
                sp.address = supply.get("address", sp.address)
                sp.distributor_name = supply.get("distributor", sp.distributor_name)
                session.add(sp)
                session.flush()

            contract_data = supply.get("contract")
            if contract_data:
                existing_contract = session.exec(
                    select(Contract).where(Contract.supply_point_id == sp.id, Contract.status == ContractStatus.active)
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
                    new_contract = Contract(
                        supply_point_id=sp.id,
                        start_date=start or date.today(),
                        end_date=end,
                        tariff_name=access_fare,
                        code_fare=contract_data.get("code_fare"),
                        contracted_powers_kw=contract_data.get("contracted_powers_kw"),
                        time_discrimination=contract_data.get("time_discrimination"),
                        marketer=contract_data.get("marketer"),
                        status=ContractStatus.active,
                    )
                    session.add(new_contract)

            existing_ts = set(
                session.exec(
                    select(ConsumptionRecord.timestamp).where(ConsumptionRecord.supply_point_id == sp.id)
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

            sp.last_synced_at = datetime.now(timezone.utc)
            session.add(sp)

        job.status = SyncStatus.success
        job.finished_at = datetime.now(timezone.utc)
        session.add(job)
        session.commit()

        background_tasks.add_task(_run_forecast_task, home_id)

        return {
            "job_id": str(job.id),
            "synced_supplies": len(supplies),
            "inserted_records": total_inserted,
            "date_from": date_from,
            "date_to": date_to,
            "forecast_queued": True,
        }

    except HTTPException:
        job.status = SyncStatus.failed
        job.finished_at = datetime.now(timezone.utc)
        session.add(job)
        session.commit()
        raise
    except Exception as e:
        job.status = SyncStatus.failed
        job.error_message = str(e)
        job.finished_at = datetime.now(timezone.utc)
        session.add(job)
        session.commit()
        raise HTTPException(status_code=500, detail=str(e))
