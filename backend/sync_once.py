"""
Hit Datadis API, store to DB, print results.
Run from backend/: python sync_once.py
"""
import logging
import sys
import uuid as _uuid
from datetime import date, datetime, timezone

from dotenv import load_dotenv
from sqlmodel import Session, select

logging.basicConfig(level=logging.WARNING)

load_dotenv(".env.local")

import os
from app.db.database import engine
from app.models import Home, SupplyPoint, ConsumptionRecord, MaxPowerRecord
from app.models.contract import Contract
from app.models.enums import ContractStatus
from app.services.datadis import fetch_all_supply_data

HOME_ID   = _uuid.UUID("9155783a-eb33-4eeb-824a-240b74b18ec1")
DATE_FROM = "2024/06"
DATE_TO   = "2026/05"

nif      = os.getenv("DATADIS_NIF")
password = os.getenv("DATADIS_PASSWORD")

if not nif or not password:
    print("ERROR: credentials not set")
    sys.exit(1)

print(f"Hitting Datadis API ({DATE_FROM} to {DATE_TO})...")

try:
    supplies = fetch_all_supply_data(nif, password, DATE_FROM, DATE_TO)
except Exception as e:
    print(f"FETCH FAILED: {e}")
    sys.exit(1)

for s in supplies:
    cups = s["cups"]
    print(f"\nCUPS: {cups}")
    print(f"  contract:     {s['contract']}")
    print(f"  consumption:  {len(s['consumption_records'])} records")
    print(f"  max_power:    {len(s['max_power_records'])} records")

# ── Store to DB ───────────────────────────────────────────────────────────────

def _parse_date(value) -> date | None:
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return datetime.strptime(str(value), "%Y/%m/%d").date()
    except ValueError:
        return None


total_consumption = 0
total_max_power   = 0

with Session(engine) as session:
    home = session.get(Home, HOME_ID)
    if not home:
        print(f"ERROR: home {HOME_ID} not found")
        sys.exit(1)

    for supply in supplies:
        cups = supply["cups"].strip()

        sp = session.exec(select(SupplyPoint).where(SupplyPoint.cups == cups)).first()
        if not sp:
            sp = SupplyPoint(
                home_id=home.id,
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
            existing = session.exec(
                select(Contract).where(
                    Contract.supply_point_id == sp.id,
                    Contract.status == ContractStatus.active,
                )
            ).first()
            start = _parse_date(contract_data.get("start_date"))
            end   = _parse_date(contract_data.get("end_date"))
            if existing:
                existing.code_fare             = contract_data.get("code_fare")
                existing.contracted_powers_kw  = contract_data.get("contracted_powers_kw")
                existing.time_discrimination   = contract_data.get("time_discrimination")
                existing.marketer              = contract_data.get("marketer")
                if start: existing.start_date  = start
                if end:   existing.end_date    = end
                session.add(existing)
            else:
                session.add(Contract(
                    supply_point_id=sp.id,
                    start_date=start or date.today(),
                    end_date=end,
                    tariff_name=contract_data.get("access_fare") or "",
                    code_fare=contract_data.get("code_fare"),
                    contracted_powers_kw=contract_data.get("contracted_powers_kw"),
                    time_discrimination=contract_data.get("time_discrimination"),
                    marketer=contract_data.get("marketer"),
                    status=ContractStatus.active,
                ))

        existing_ts = set(
            session.exec(
                select(ConsumptionRecord.timestamp).where(ConsumptionRecord.supply_point_id == sp.id)
            ).all()
        )
        seen_ts = set(existing_ts)
        for r in supply.get("consumption_records", []):
            if r["timestamp"] not in seen_ts:
                seen_ts.add(r["timestamp"])
                session.add(ConsumptionRecord(
                    supply_point_id=sp.id,
                    timestamp=r["timestamp"],
                    consumption_kwh=r["consumption_kwh"],
                ))
                total_consumption += 1

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
                total_max_power += 1

        sp.last_synced_at = datetime.now(timezone.utc)
        session.add(sp)

    session.commit()

print(f"\nDone. New consumption: {total_consumption}, new max_power: {total_max_power}")
