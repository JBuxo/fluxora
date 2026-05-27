import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.core.deps import current_user
from app.db.database import get_session
from app.models import ConsumptionRecord, Contract, Home, SupplyPoint, WeatherRecord
from app.models.enums import ContractStatus

router = APIRouter(prefix="/supply-points", tags=["analytics"])


def _owned_supply_point(sp_id: uuid.UUID, user_id: uuid.UUID, session: Session) -> SupplyPoint:
    sp = session.get(SupplyPoint, sp_id)
    if not sp:
        raise HTTPException(404, "Supply point not found")
    home = session.get(Home, sp.home_id)
    if not home or home.user_id != user_id:
        raise HTTPException(404, "Supply point not found")
    return sp


def _default_range():
    now = datetime.now(timezone.utc)
    return now - timedelta(days=30), now


def _fetch_records(sp_id: uuid.UUID, from_dt: datetime, to_dt: datetime, session: Session):
    return session.exec(
        select(ConsumptionRecord)
        .where(ConsumptionRecord.supply_point_id == sp_id)
        .where(ConsumptionRecord.timestamp >= from_dt)
        .where(ConsumptionRecord.timestamp <= to_dt)
    ).all()


@router.get("/{sp_id}/consumption/summary")
def get_summary(
    sp_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    _owned_supply_point(sp_id, user_id, session)

    contract = session.exec(
        select(Contract).where(
            Contract.supply_point_id == sp_id,
            Contract.status == ContractStatus.active,
        )
    ).first()
    rate = contract.energy_rate_kwh if contract and contract.energy_rate_kwh else 0.19

    now = datetime.now(timezone.utc)
    mtd_from = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    mtd_records = _fetch_records(sp_id, mtd_from, now, session)
    mtd_kwh = sum(r.consumption_kwh for r in mtd_records)
    mtd_cost = round(mtd_kwh * rate, 2)

    days_elapsed = max(now.day - 1, 1)
    avg_daily_kwh = round(mtd_kwh / days_elapsed, 3)

    # same number of days last month for comparison
    first_of_last = (mtd_from - timedelta(days=1)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_end = first_of_last.replace(day=min(now.day, 28))
    prev_records = _fetch_records(sp_id, first_of_last, last_month_end, session)
    prev_kwh = sum(r.consumption_kwh for r in prev_records)

    vs_last_month_pct = round((mtd_kwh - prev_kwh) / prev_kwh * 100, 1) if prev_kwh > 0 else 0.0

    return {
        "mtd_kwh": round(mtd_kwh, 2),
        "mtd_cost": mtd_cost,
        "avg_daily_kwh": avg_daily_kwh,
        "vs_last_month_pct": vs_last_month_pct,
        "record_count": len(mtd_records),
    }


@router.get("/{sp_id}/consumption/monthly")
def get_monthly(
    sp_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
    from_dt: Optional[datetime] = Query(None),
    to_dt: Optional[datetime] = Query(None),
):
    _owned_supply_point(sp_id, user_id, session)

    rolling_window = from_dt is None and to_dt is None
    if rolling_window:
        now = datetime.now(timezone.utc)
        # End: last day of the month before current month
        first_of_current = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        to_dt = first_of_current - timedelta(seconds=1)
        # Start: first day 4 months before that
        month = first_of_current.month - 4
        year = first_of_current.year
        if month <= 0:
            month += 12
            year -= 1
        from_dt = first_of_current.replace(year=year, month=month, day=1)

    contract = session.exec(
        select(Contract).where(
            Contract.supply_point_id == sp_id,
            Contract.status == ContractStatus.active,
        )
    ).first()
    rate = contract.energy_rate_kwh if contract and contract.energy_rate_kwh else 0.19

    current = _fetch_records(sp_id, from_dt, to_dt, session)

    # Fetch window shifted 1 month back for month-over-month comparison
    def _shift_month(dt: datetime, delta: int) -> datetime:
        month = dt.month + delta
        year = dt.year
        while month > 12:
            month -= 12
            year += 1
        while month < 1:
            month += 12
            year -= 1
        return dt.replace(year=year, month=month)

    prev_from = _shift_month(from_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0), -1)
    prev_to = to_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(seconds=1)
    previous = _fetch_records(sp_id, prev_from, prev_to, session)

    def by_month(records):
        buckets: dict = defaultdict(lambda: {"kwh": 0.0, "cost": 0.0})
        for r in records:
            ts = r.timestamp.replace(tzinfo=None) if r.timestamp.tzinfo else r.timestamp
            key = ts.strftime("%Y-%m")
            buckets[key]["kwh"] += r.consumption_kwh
            buckets[key]["cost"] += (r.cost_estimate or r.consumption_kwh * rate)
        return buckets

    cur = by_month(current)
    # Re-key previous buckets +1 month to align with current window
    prev_raw = by_month(previous)
    prev: dict = {}
    for k, v in prev_raw.items():
        dt = datetime.strptime(k, "%Y-%m")
        cur_key = _shift_month(dt, 1).strftime("%Y-%m")
        prev[cur_key] = v

    all_keys = sorted(set(list(cur.keys()) + list(prev.keys())))

    return [
        {
            "month": datetime.strptime(k, "%Y-%m").strftime("%b %y"),
            "consumption": round(cur[k]["kwh"], 2) if k in cur else 0,
            "previous": round(prev[k]["kwh"], 2) if k in prev else None,
            "cost": round(cur[k]["cost"], 2) if k in cur else 0,
        }
        for k in all_keys
    ]


@router.get("/{sp_id}/consumption/temp-correlation")
def get_temp_correlation(
    sp_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    sp = _owned_supply_point(sp_id, user_id, session)
    home = session.get(Home, sp.home_id)

    records = session.exec(
        select(ConsumptionRecord).where(ConsumptionRecord.supply_point_id == sp_id)
    ).all()

    monthly_kwh: dict = defaultdict(float)
    for r in records:
        ts = r.timestamp.replace(tzinfo=None) if r.timestamp.tzinfo else r.timestamp
        key = ts.strftime("%Y-%m")
        monthly_kwh[key] += r.consumption_kwh

    monthly_temp: dict = defaultdict(list)
    if home and home.weather_location_id:
        weather_recs = session.exec(
            select(WeatherRecord).where(WeatherRecord.location_id == home.weather_location_id)
        ).all()
        for w in weather_recs:
            if w.temp_mean_c is not None:
                monthly_temp[w.record_date.strftime("%Y-%m")].append(w.temp_mean_c)

    return [
        {
            "month": datetime.strptime(k, "%Y-%m").strftime("%b %y"),
            "consumption": round(monthly_kwh[k], 2),
            "avg_temp": round(sum(monthly_temp[k]) / len(monthly_temp[k]), 1) if monthly_temp.get(k) else None,
        }
        for k in sorted(monthly_kwh.keys())
    ]


@router.get("/{sp_id}/consumption/heatmap")
def get_heatmap(
    sp_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
    from_dt: Optional[datetime] = Query(None),
    to_dt: Optional[datetime] = Query(None),
):
    _owned_supply_point(sp_id, user_id, session)

    if from_dt is None or to_dt is None:
        now = datetime.now(timezone.utc)
        first_of_current = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_of_prev = first_of_current - timedelta(seconds=1)
        from_dt = last_of_prev.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        to_dt = last_of_prev

    records = _fetch_records(sp_id, from_dt, to_dt, session)

    buckets: dict = defaultdict(list)
    for r in records:
        ts = r.timestamp.replace(tzinfo=None) if r.timestamp.tzinfo else r.timestamp
        buckets[(ts.weekday(), ts.hour)].append(r.consumption_kwh)

    avgs = {k: sum(v) / len(v) for k, v in buckets.items()}
    max_val = max(avgs.values(), default=1) or 1

    return [
        {
            "day": day,
            "hour": hour,
            "avg_kwh": round(avgs.get((day, hour), 0), 3),
            "value": round(avgs[(day, hour)] / max_val, 3)
            if (day, hour) in avgs
            else 0,
        }
        for day in range(7)
        for hour in range(24)
    ]
