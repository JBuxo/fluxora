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
from app.services.tariff import BillBreakdown, build_hourly_profile, compute_bill, disaggregate_daily

router = APIRouter(prefix="/homes", tags=["forecast"])


class DailyForecast(BaseModel):
    date: date
    predicted_kwh: float
    lower_kwh: float
    upper_kwh: float


class BillEstimate(BaseModel):
    # kWh breakdown
    mtd_actual_kwh: float
    projected_remaining_kwh: float
    total_projected_kwh: float

    # P1/P2 split for remaining period
    projected_p1_kwh: float
    projected_p2_kwh: float

    # Cost breakdown (central estimate)
    energy_cost_eur: float
    power_cost_eur: float
    cargos_eur: float
    meter_rent_eur: float
    iee_eur: float
    iva_eur: float

    # Final totals with confidence range
    estimated_bill_eur: float
    bill_low_eur: float
    bill_high_eur: float

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

    # ── Month-to-date actual consumption ─────────────────────────────────────
    mtd_actual_kwh = 0.0
    historical_records: list[ConsumptionRecord] = []
    if supply_point_ids:
        historical_records = session.exec(
            select(ConsumptionRecord).where(
                ConsumptionRecord.supply_point_id.in_(supply_point_ids),
            )
        ).all()

        mtd_start = datetime(today.year, today.month, 1)
        mtd_end = datetime(today.year, today.month, today.day)
        mtd_records = [
            r for r in historical_records
            if mtd_start <= r.timestamp.replace(tzinfo=None) < mtd_end
        ]
        mtd_actual_kwh = sum(r.consumption_kwh for r in mtd_records)

    # ── Forecast records ──────────────────────────────────────────────────────
    rolling_end = today + timedelta(days=30)

    daily_forecasts = session.exec(
        select(ForecastRecord).where(
            ForecastRecord.home_id == home_id,
            ForecastRecord.forecast_date >= today,
            ForecastRecord.forecast_date <= rolling_end,
        ).order_by(ForecastRecord.forecast_date)
    ).all()

    # Current-month remaining days only (for bill estimate)
    month_forecasts = [f for f in daily_forecasts if f.forecast_date <= month_end]

    # ── Active contract ───────────────────────────────────────────────────────
    active_contract: Contract | None = None
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

    # ── Build hourly profile + disaggregate ───────────────────────────────────
    hourly_profile = build_hourly_profile(historical_records)
    hourly_month_forecast = disaggregate_daily(month_forecasts, hourly_profile)

    # ── Compute bill via tariff engine ────────────────────────────────────────
    days_remaining = (month_end - today).days
    days_in_period = (month_end - month_start).days + 1

    if active_contract and month_forecasts:
        breakdown: BillBreakdown = compute_bill(
            hourly_forecast=hourly_month_forecast,
            contract=active_contract,
            days_in_period=days_in_period,
        )
        projected_remaining_kwh = sum(f.predicted_kwh for f in month_forecasts)
        total_projected_kwh = mtd_actual_kwh + projected_remaining_kwh

        bill_estimate = BillEstimate(
            mtd_actual_kwh=round(mtd_actual_kwh, 3),
            projected_remaining_kwh=round(projected_remaining_kwh, 3),
            total_projected_kwh=round(total_projected_kwh, 3),
            projected_p1_kwh=breakdown.energy_p1_kwh,
            projected_p2_kwh=breakdown.energy_p2_kwh,
            energy_cost_eur=breakdown.energy_cost_eur,
            power_cost_eur=breakdown.power_cost_eur,
            cargos_eur=breakdown.cargos_eur,
            meter_rent_eur=breakdown.meter_rent_eur,
            iee_eur=breakdown.iee_eur,
            iva_eur=breakdown.iva_eur,
            estimated_bill_eur=breakdown.total_eur,
            bill_low_eur=breakdown.total_low_eur,
            bill_high_eur=breakdown.total_high_eur,
            days_remaining=days_remaining,
        )
    else:
        # No contract or no forecast yet — return zeros
        projected_remaining_kwh = sum(f.predicted_kwh for f in month_forecasts)
        bill_estimate = BillEstimate(
            mtd_actual_kwh=round(mtd_actual_kwh, 3),
            projected_remaining_kwh=round(projected_remaining_kwh, 3),
            total_projected_kwh=round(mtd_actual_kwh + projected_remaining_kwh, 3),
            projected_p1_kwh=0.0,
            projected_p2_kwh=0.0,
            energy_cost_eur=0.0,
            power_cost_eur=0.0,
            cargos_eur=0.0,
            meter_rent_eur=0.0,
            iee_eur=0.0,
            iva_eur=0.0,
            estimated_bill_eur=0.0,
            bill_low_eur=0.0,
            bill_high_eur=0.0,
            days_remaining=days_remaining,
        )

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
        bill_estimate=bill_estimate,
        last_run_at=last_run_at,
    )
