import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.core.deps import current_user
from app.db.database import get_session
from app.routes.analytics import _owned_supply_point, _fetch_records

router = APIRouter(prefix="/supply-points", tags=["report"])


def _classify_tou(weekday: int, hour: int) -> str:
    if weekday >= 5:
        return "P3"
    if (10 <= hour < 14) or (18 <= hour < 22):
        return "P1"
    if (8 <= hour < 10) or (14 <= hour < 18) or hour >= 22:
        return "P2"
    return "P3"


def _heatmap_from_records(records):
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
            "value": round(avgs[(day, hour)] / max_val, 3) if (day, hour) in avgs else 0,
        }
        for day in range(7)
        for hour in range(24)
    ]


def _tou_from_heatmap(heatmap):
    buckets = {"P1": 0.0, "P2": 0.0, "P3": 0.0}
    for pt in heatmap:
        buckets[_classify_tou(pt["day"], pt["hour"])] += pt["avg_kwh"]
    total = sum(buckets.values()) or 1
    return {
        "P1": round(buckets["P1"], 2),
        "P2": round(buckets["P2"], 2),
        "P3": round(buckets["P3"], 2),
        "total": round(total, 2),
        "P1_pct": round(buckets["P1"] / total * 100, 1),
        "P2_pct": round(buckets["P2"] / total * 100, 1),
        "P3_pct": round(buckets["P3"] / total * 100, 1),
    }


def _monthly_from_records(records, period_days, from_dt):
    prev_from = from_dt - timedelta(days=period_days)

    def by_month(recs):
        b: dict = defaultdict(lambda: {"kwh": 0.0, "cost": 0.0})
        for r in recs:
            ts = r.timestamp.replace(tzinfo=None) if r.timestamp.tzinfo else r.timestamp
            key = ts.strftime("%Y-%m")
            b[key]["kwh"] += r.consumption_kwh
            b[key]["cost"] += r.cost_estimate or 0
        return b

    cur = by_month(records)
    all_keys = sorted(cur.keys())
    return [
        {
            "month": datetime.strptime(k, "%Y-%m").strftime("%b"),
            "consumption": round(cur[k]["kwh"], 2),
            "previous": 0,
            "cost": round(cur[k]["cost"], 2),
        }
        for k in all_keys
    ]


def _suggestions(heatmap, summary, tou):
    suggestions = []

    weekday_hours: dict = defaultdict(list)
    for pt in heatmap:
        if pt["day"] < 5:
            weekday_hours[pt["hour"]].append(pt["avg_kwh"])

    hour_avgs = {h: sum(v) / len(v) for h, v in weekday_hours.items() if v}
    evening_avg = sum(hour_avgs.get(h, 0) for h in range(18, 23)) / 5
    night_avg = sum(hour_avgs.get(h, 0) for h in range(0, 8)) / 8 or 0.001

    day_totals: dict = defaultdict(float)
    for pt in heatmap:
        day_totals[pt["day"]] += pt["avg_kwh"]

    weekday_avg = sum(day_totals.get(d, 0) for d in range(5)) / 5 or 0.001
    weekend_avg = sum(day_totals.get(d, 0) for d in range(5, 7)) / 2
    weekend_uplift = (weekend_avg - weekday_avg) / weekday_avg * 100

    if evening_avg > night_avg * 1.5:
        saving = round(evening_avg * 5 * 4 * 0.30 * 0.18, 0)
        suggestions.append({
            "type": "timing",
            "headline": "Most of your evening usage falls in the most expensive hours",
            "detail": (
                f"Between 18:00–22:00 your average is {evening_avg:.2f} kWh/h vs "
                f"{night_avg:.2f} kWh/h overnight. Shifting usage past 22:00 (P2/P3) "
                "could meaningfully reduce your bill."
            ),
            "saving_estimate": f"~€{int(saving)}/month",
        })

    if tou["P1_pct"] > 22:
        saving = round(tou["P1"] * 0.05 * 4, 0)
        suggestions.append({
            "type": "tariff",
            "headline": "High share of consumption in expensive peak hours",
            "detail": (
                f"{tou['P1_pct']:.1f}% of your consumption falls in P1 (Mon–Fri 10–14h, "
                "18–22h). Shifting high-draw appliances out of these windows would lower "
                "your effective cost per kWh."
            ),
            "saving_estimate": f"~€{int(saving)}/month",
        })

    if weekend_uplift > 15:
        saving = round((weekend_avg - weekday_avg) * 2 * 4 * 0.18, 0)
        suggestions.append({
            "type": "habit",
            "headline": f"Weekend consumption runs {weekend_uplift:.0f}% above weekday average",
            "detail": (
                f"Average weekend day: {weekend_avg:.1f} kWh vs {weekday_avg:.1f} kWh on "
                "weekdays. Consistent enough to be worth examining — small habit shifts "
                "on weekends add up."
            ),
            "saving_estimate": f"~€{int(saving)}/month",
        })

    if not suggestions:
        suggestions.append({
            "type": "habit",
            "headline": "Consumption pattern looks well-distributed",
            "detail": "No strong patterns detected that suggest easy savings. Keep monitoring as more data is collected.",
            "saving_estimate": "—",
        })

    return suggestions


@router.get("/{sp_id}/report")
def get_report(
    sp_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
    from_dt: Optional[datetime] = Query(None),
    to_dt: Optional[datetime] = Query(None),
):
    sp = _owned_supply_point(sp_id, user_id, session)

    if from_dt is None or to_dt is None:
        to_dt = datetime.now(timezone.utc)
        from_dt = to_dt - timedelta(days=90)

    period_days = max((to_dt - from_dt).days, 1)
    records = _fetch_records(sp_id, from_dt, to_dt, session)

    total_kwh = sum(r.consumption_kwh for r in records)
    total_cost = sum(r.cost_estimate or 0 for r in records)
    avg_daily_kwh = round(total_kwh / period_days, 3)

    prev_records = _fetch_records(sp_id, from_dt - timedelta(days=period_days), from_dt, session)
    prev_kwh = sum(r.consumption_kwh for r in prev_records)
    raw_trend = (total_kwh - prev_kwh) / prev_kwh * 100 if prev_kwh > 0 else 0.0
    trend_pct = round(max(-999.0, min(999.0, raw_trend)), 1)

    heatmap = _heatmap_from_records(records)
    tou = _tou_from_heatmap(heatmap)
    monthly = _monthly_from_records(records, period_days, from_dt)

    summary = {
        "total_kwh": round(total_kwh, 2),
        "total_cost": round(total_cost, 2),
        "avg_daily_kwh": avg_daily_kwh,
        "trend_pct": trend_pct,
        "forecasted_monthly_cost": round(total_cost / period_days * 30, 2),
        "record_count": len(records),
    }

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "period": {
            "from": from_dt.isoformat(),
            "to": to_dt.isoformat(),
            "days": period_days,
        },
        "supply_point": {
            "id": str(sp.id),
            "cups": sp.cups,
            "address": sp.address,
        },
        "summary": summary,
        "monthly": monthly,
        "heatmap": heatmap,
        "tou": tou,
        "suggestions": _suggestions(heatmap, summary, tou),
    }
