import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from dotenv import load_dotenv
from sqlmodel import Session, select

from app.core.deps import current_user
from app.db.database import get_session
from app.models import Home, SupplyPoint, ConsumptionRecord
from app.services.datadis import fetch_supplies, fetch_consumption

load_dotenv(".env.local")

router = APIRouter(prefix="/datadis", tags=["datadis"])


def _get_credentials():
    nif = os.getenv("DATADIS_NIF")
    password = os.getenv("DATADIS_PASSWORD")
    if not nif or not password:
        raise HTTPException(status_code=500, detail="Datadis credentials not configured")
    return nif, password


@router.post("/homes/{home_id}/sync")
def sync_consumption(
    home_id: uuid.UUID,
    date_from: str = Query(..., example="2024/06", description="Start month YYYY/MM"),
    date_to: str = Query(..., example="2026/05", description="End month YYYY/MM"),
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    home = session.get(Home, home_id)
    if not home or home.user_id != user_id:
        raise HTTPException(status_code=404, detail="Home not found")

    nif, password = _get_credentials()

    try:
        supplies = fetch_supplies(nif, password)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Datadis supplies error: {e}")

    total_inserted = 0

    for supply in supplies:
        cups = supply["cups"].strip()
        distributor_code = supply["distributor_code"]

        # Upsert SupplyPoint
        sp = session.exec(select(SupplyPoint).where(SupplyPoint.cups == cups)).first()
        if not sp:
            sp = SupplyPoint(
                home_id=home_id,
                cups=cups,
                address=supply.get("address", ""),
                distributor_name=supply.get("distributor", ""),
            )
            session.add(sp)
            session.flush()  # get sp.id before inserting records
        else:
            # update address/distributor in case they changed
            sp.address = supply.get("address", sp.address)
            sp.distributor_name = supply.get("distributor", sp.distributor_name)
            session.add(sp)
            session.flush()

        # Fetch consumption
        try:
            records = fetch_consumption(nif, password, cups, distributor_code, date_from, date_to)
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Datadis consumption error for {cups}: {e}")

        # Find existing timestamps to avoid duplicates
        existing_ts = set(
            session.exec(
                select(ConsumptionRecord.timestamp).where(ConsumptionRecord.supply_point_id == sp.id)
            ).all()
        )

        new_records = [
            ConsumptionRecord(
                supply_point_id=sp.id,
                timestamp=r["timestamp"],
                consumption_kwh=r["consumption_kwh"],
            )
            for r in records
            if r["timestamp"] not in existing_ts
        ]

        for rec in new_records:
            session.add(rec)

        sp.last_synced_at = datetime.now(timezone.utc)
        session.add(sp)
        total_inserted += len(new_records)

    session.commit()

    return {"synced_supplies": len(supplies), "inserted_records": total_inserted}
