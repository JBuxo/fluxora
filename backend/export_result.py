"""
Export DB data to result.json. No API calls.
Run from backend/: python export_result.py
"""
import json
from datetime import datetime, date

from dotenv import load_dotenv
from sqlmodel import Session, select

load_dotenv(".env.local")

from app.db.database import engine
from app.models import SupplyPoint, ConsumptionRecord, MaxPowerRecord
from app.models.contract import Contract
from app.models.enums import ContractStatus


def default(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Not serializable: {type(obj)}")


with Session(engine) as session:
    supply_points = session.exec(select(SupplyPoint)).all()
    result = []

    for sp in supply_points:
        contract = session.exec(
            select(Contract).where(
                Contract.supply_point_id == sp.id,
                Contract.status == ContractStatus.active,
            )
        ).first()

        consumption = session.exec(
            select(ConsumptionRecord)
            .where(ConsumptionRecord.supply_point_id == sp.id)
            .order_by(ConsumptionRecord.timestamp)
        ).all()

        max_power = session.exec(
            select(MaxPowerRecord)
            .where(MaxPowerRecord.supply_point_id == sp.id)
            .order_by(MaxPowerRecord.timestamp)
        ).all()

        result.append({
            "cups": sp.cups,
            "address": sp.address,
            "distributor_name": sp.distributor_name,
            "last_synced_at": sp.last_synced_at,
            "contract": {
                "tariff_name": contract.tariff_name,
                "code_fare": contract.code_fare,
                "contracted_powers_kw": contract.contracted_powers_kw,
                "time_discrimination": contract.time_discrimination,
                "marketer": contract.marketer,
                "start_date": contract.start_date,
                "end_date": contract.end_date,
                "status": contract.status,
            } if contract else None,
            "consumption_records": [
                {"timestamp": r.timestamp, "consumption_kwh": r.consumption_kwh}
                for r in consumption
            ],
            "max_power_records": [
                {"timestamp": r.timestamp, "max_power_kw": r.max_power_kw, "period": r.period}
                for r in max_power
            ],
        })

with open("result.json", "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, default=default)

for sp_data in result:
    print(f"{sp_data['cups']}: {len(sp_data['consumption_records'])} consumption, {len(sp_data['max_power_records'])} max_power")

print(f"\nWritten to result.json ({len(result)} supply points)")
