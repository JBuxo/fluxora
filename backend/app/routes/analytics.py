import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.core.deps import current_user
from app.db.database import get_session
from app.models import ConsumptionRecord, Contract, Home, SupplyPoint
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
    from_dt: Optional[datetime] = Query(None),
    to_dt: Optional[datetime] = Query(None),
):
    _owned_supply_point(sp_id, user_id, session)

    if from_dt is None or to_dt is None:
        from_dt, to_dt = _default_range()

    records = _fetch_records(sp_id, from_dt, to_dt, session)
    total_kwh = sum(r.consumption_kwh for r in records)
    total_cost = sum(r.cost_estimate or 0 for r in records)

    period_days = max((to_dt - from_dt).days, 1)
    prev_from = from_dt - timedelta(days=period_days)
    prev_records = _fetch_records(sp_id, prev_from, from_dt, session)
    prev_kwh = sum(r.consumption_kwh for r in prev_records)

    trend_pct = round((total_kwh - prev_kwh) / prev_kwh * 100, 1) if prev_kwh > 0 else 0.0
    avg_daily_kwh = round(total_kwh / period_days, 3)
    avg_daily_cost = total_cost / period_days
    forecasted_monthly_cost = round(avg_daily_cost * 30, 2)

    return {
        "total_kwh": round(total_kwh, 2),
        "total_cost": round(total_cost, 2),
        "avg_daily_kwh": avg_daily_kwh,
        "trend_pct": trend_pct,
        "forecasted_monthly_cost": forecasted_monthly_cost,
        "record_count": len(records),
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

    if from_dt is None or to_dt is None:
        now = datetime.now(timezone.utc)
        to_dt = now
        from_dt = now - timedelta(days=180)

    period_days = max((to_dt - from_dt).days, 1)
    prev_from = from_dt - timedelta(days=period_days)

    current = _fetch_records(sp_id, from_dt, to_dt, session)
    previous = _fetch_records(sp_id, prev_from, from_dt, session)

    def by_month(records):
        buckets: dict = defaultdict(lambda: {"kwh": 0.0, "cost": 0.0})
        for r in records:
            ts = r.timestamp.replace(tzinfo=None) if r.timestamp.tzinfo else r.timestamp
            key = ts.strftime("%Y-%m")
            buckets[key]["kwh"] += r.consumption_kwh
            buckets[key]["cost"] += r.cost_estimate or 0
        return buckets

    cur = by_month(current)
    prev = by_month(previous)
    all_keys = sorted(set(list(cur.keys()) + list(prev.keys())))

    return [
        {
            "month": datetime.strptime(k, "%Y-%m").strftime("%b"),
            "consumption": round(cur[k]["kwh"], 2) if k in cur else 0,
            "previous": round(prev[k]["kwh"], 2) if k in prev else 0,
            "cost": round(cur[k]["cost"], 2) if k in cur else 0,
        }
        for k in all_keys
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
        to_dt = now
        from_dt = now - timedelta(days=30)

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
