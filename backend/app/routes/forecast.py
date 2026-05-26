import json
import os
import uuid
from calendar import monthrange
from datetime import date, datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.deps import current_user
from app.db.database import get_session
from app.models import ConsumptionRecord, Contract, Home, SupplyPoint
from app.models.enums import ContractStatus
from app.models.forecast_record import ForecastRecord

router = APIRouter(prefix="/homes", tags=["forecast"])

DEFAULT_RATE = float(os.getenv("DEFAULT_RATE_EUR_KWH", "0.19"))


class DailyForecast(BaseModel):
    date: date
    predicted_kwh: float
    lower_kwh: float
    upper_kwh: float


class BillEstimate(BaseModel):
    mtd_actual_kwh: float
    projected_remaining_kwh: float
    total_projected_kwh: float
    energy_rate_kwh: float
    variable_cost_eur: float
    fixed_cost_eur: float | None
    estimated_bill_eur: float
    days_remaining: int


class ForecastResponse(BaseModel):
    daily: List[DailyForecast]
    bill_estimate: BillEstimate
    last_run_at: datetime | None


@router.get("/{home_id}/forecast", response_model=ForecastResponse)
def get_forecast(
    home_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    home = session.get(Home, home_id)
    if not home or home.user_id != user_id:
        raise HTTPException(status_code=404, detail="Home not found")

    today = date.today()
    month_start = today.replace(day=1)
    _, days_in_month = monthrange(today.year, today.month)
    month_end = today.replace(day=days_in_month)

    supply_point_ids = [
        sp.id
        for sp in session.exec(select(SupplyPoint).where(SupplyPoint.home_id == home_id)).all()
    ]

    mtd_actual_kwh = 0.0
    if supply_point_ids:
        records = session.exec(
            select(ConsumptionRecord).where(
                ConsumptionRecord.supply_point_id.in_(supply_point_ids),
                ConsumptionRecord.timestamp >= datetime(today.year, today.month, 1, tzinfo=timezone.utc),
                ConsumptionRecord.timestamp < datetime(today.year, today.month, today.day, tzinfo=timezone.utc),
            )
        ).all()
        mtd_actual_kwh = sum(r.consumption_kwh for r in records)

    rolling_end = today + timedelta(days=30)

    # full 30-day window for the chart
    daily_forecasts = session.exec(
        select(ForecastRecord).where(
            ForecastRecord.home_id == home_id,
            ForecastRecord.forecast_date >= today,
            ForecastRecord.forecast_date <= rolling_end,
        ).order_by(ForecastRecord.forecast_date)
    ).all()

    # current-month only for bill estimate
    forecasts = session.exec(
        select(ForecastRecord).where(
            ForecastRecord.home_id == home_id,
            ForecastRecord.forecast_date >= today,
            ForecastRecord.forecast_date <= month_end,
        ).order_by(ForecastRecord.forecast_date)
    ).all()

    active_contract = None
    if supply_point_ids:
        for sp_id in supply_point_ids:
            c = session.exec(
                select(Contract).where(
                    Contract.supply_point_id == sp_id,
                    Contract.status == ContractStatus.active,
                )
            ).first()
            if c:
                active_contract = c
                break

    energy_rate = (
        active_contract.energy_rate_kwh
        if active_contract and active_contract.energy_rate_kwh is not None
        else DEFAULT_RATE
    )

    projected_remaining_kwh = sum(f.predicted_kwh for f in forecasts)
    total_projected_kwh = mtd_actual_kwh + projected_remaining_kwh
    variable_cost = round(total_projected_kwh * energy_rate, 2)

    fixed_cost = None
    if active_contract:
        import json
        powers_raw = active_contract.contracted_powers_kw
        peak_rate = active_contract.power_rate_peak_kw_day
        valley_rate = active_contract.power_rate_valley_kw_day
        if powers_raw and (peak_rate or valley_rate):
            try:
                powers = json.loads(powers_raw) if isinstance(powers_raw, str) else list(powers_raw)
                peak_kw = float(powers[0]) if powers else 0.0
                valley_kw = float(powers[1]) if len(powers) > 1 else peak_kw
                days_in_month = (month_end - month_start).days + 1
                fixed_cost = round(
                    (peak_kw * (peak_rate or 0.0) + valley_kw * (valley_rate or 0.0)) * days_in_month,
                    2,
                )
            except (ValueError, IndexError, TypeError):
                fixed_cost = None

    estimated_bill_eur = round(variable_cost + (fixed_cost or 0.0), 2)
    days_remaining = (month_end - today).days

    last_run_at = max((f.run_at for f in daily_forecasts), default=None)

    daily = [
        DailyForecast(
            date=f.forecast_date,
            predicted_kwh=f.predicted_kwh,
            lower_kwh=f.lower_kwh,
            upper_kwh=f.upper_kwh,
        )
        for f in daily_forecasts
    ]

    return ForecastResponse(
        daily=daily,
        bill_estimate=BillEstimate(
            mtd_actual_kwh=round(mtd_actual_kwh, 3),
            projected_remaining_kwh=round(projected_remaining_kwh, 3),
            total_projected_kwh=round(total_projected_kwh, 3),
            energy_rate_kwh=energy_rate,
            variable_cost_eur=variable_cost,
            fixed_cost_eur=fixed_cost,
            estimated_bill_eur=estimated_bill_eur,
            days_remaining=days_remaining,
        ),
        last_run_at=last_run_at,
    )
