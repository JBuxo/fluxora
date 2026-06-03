import json
import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from typing import Any, Optional

import numpy as np
from sqlmodel import Session, select, func

from app.models.anomaly_record import AnomalyRecord
from app.models.consumption_record import ConsumptionRecord
from app.models.contract import Contract
from app.models.enums import ContractStatus
from app.models.forecast_record import ForecastRecord
from app.models.recommendation_feedback import RecommendationFeedback
from app.models.supply_point import SupplyPoint
from app.models.usage_profile import UsageProfile
from app.models.weather_record import WeatherRecord

# Spain 2.0TD peak hours: Mon-Fri 10-14, 18-22 (8/24 = 0.333)
_P1_HOURS = set(range(10, 14)) | set(range(18, 22))

_POSITIVE_ACTIONS = {"accepted", "already_doing"}
_NEGATIVE_ACTIONS = {"dismissed", "not_useful"}


@dataclass
class Recommendation:
    id: str
    type: str
    title: str
    detail: str
    potential_saving_eur: float
    confidence: str  # "high" | "medium" | "low"
    supporting_data: dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Data loaders
# ---------------------------------------------------------------------------

def _get_supply_point_ids(session: Session, home_id: uuid.UUID) -> list[uuid.UUID]:
    rows = session.exec(
        select(SupplyPoint.id).where(SupplyPoint.home_id == home_id, SupplyPoint.active == True)
    ).all()
    return list(rows)


def _get_active_contract(session: Session, sp_ids: list[uuid.UUID]) -> Optional[Contract]:
    if not sp_ids:
        return None
    for sp_id in sp_ids:
        contract = session.exec(
            select(Contract)
            .where(Contract.supply_point_id == sp_id, Contract.status == ContractStatus.active)
            .order_by(Contract.created_at.desc())
        ).first()
        if contract:
            return contract
    return None


def _get_hourly_consumption(
    session: Session, sp_ids: list[uuid.UUID], days: int = 60
) -> list[tuple[datetime, float]]:
    if not sp_ids:
        return []
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = session.exec(
        select(ConsumptionRecord.timestamp, ConsumptionRecord.consumption_kwh)
        .where(
            ConsumptionRecord.supply_point_id.in_(sp_ids),
            ConsumptionRecord.timestamp >= since,
        )
        .order_by(ConsumptionRecord.timestamp)
    ).all()
    return list(rows)


def _get_forecast_rows(session: Session, home_id: uuid.UUID) -> list[ForecastRecord]:
    today = date.today()
    return list(session.exec(
        select(ForecastRecord)
        .where(ForecastRecord.home_id == home_id, ForecastRecord.forecast_date >= today)
        .order_by(ForecastRecord.forecast_date)
    ).all())


def _get_recent_anomalies(
    session: Session, home_id: uuid.UUID, days: int = 14
) -> list[AnomalyRecord]:
    since = date.today() - timedelta(days=days)
    return list(session.exec(
        select(AnomalyRecord)
        .where(
            AnomalyRecord.home_id == home_id,
            AnomalyRecord.anomaly_date >= since,
            AnomalyRecord.is_anomaly == True,
        )
    ).all())


def _get_usage_profile(session: Session, home_id: uuid.UUID) -> Optional[UsageProfile]:
    return session.exec(
        select(UsageProfile).where(UsageProfile.home_id == home_id)
    ).first()


def _get_actual_last_30_days(
    session: Session, sp_ids: list[uuid.UUID]
) -> float:
    if not sp_ids:
        return 0.0
    since = datetime.now(timezone.utc) - timedelta(days=30)
    result = session.exec(
        select(func.sum(ConsumptionRecord.consumption_kwh))
        .where(
            ConsumptionRecord.supply_point_id.in_(sp_ids),
            ConsumptionRecord.timestamp >= since,
        )
    ).first()
    return float(result or 0.0)


# ---------------------------------------------------------------------------
# Rule: timing shift
# ---------------------------------------------------------------------------

def _rule_timing_shift(
    hourly: list[tuple[datetime, float]], contract: Optional[Contract]
) -> Optional[Recommendation]:
    if not hourly or not contract:
        return None
    p1_rate = contract.energy_rate_p1_kwh or 0.0
    p2_rate = contract.energy_rate_p2_kwh or 0.0
    if p1_rate - p2_rate < 0.03:
        return None

    peak_kwh = sum(kwh for ts, kwh in hourly if ts.weekday() < 5 and ts.hour in _P1_HOURS)
    total_kwh = sum(kwh for _, kwh in hourly) or 1.0
    peak_pct = peak_kwh / total_kwh

    if peak_pct < 0.40:
        return None

    monthly_kwh = total_kwh / (len({ts.date() for ts, _ in hourly}) / 30.0) if hourly else 0
    shiftable_kwh = monthly_kwh * (peak_pct - 0.25)
    saving = shiftable_kwh * (p1_rate - p2_rate)

    if saving < 5.0:
        return None

    confidence = "high" if peak_pct > 0.55 else "medium"
    return Recommendation(
        id="timing_shift",
        type="timing",
        title=f"{round(peak_pct * 100)}% of usage falls in expensive peak hours",
        detail=(
            f"You consume heavily between 10–14h and 18–22h (P1 rate: €{p1_rate:.3f}/kWh). "
            f"Shifting flexible loads (laundry, dishwasher, EV) to after 22h or before 10h "
            f"could save ~€{saving:.0f}/month."
        ),
        potential_saving_eur=round(saving, 2),
        confidence=confidence,
        supporting_data={
            "peak_pct": round(peak_pct, 3),
            "p1_rate_eur_kwh": p1_rate,
            "p2_rate_eur_kwh": p2_rate,
            "rate_delta": round(p1_rate - p2_rate, 4),
        },
    )


# ---------------------------------------------------------------------------
# Rule: forecast spike
# ---------------------------------------------------------------------------

def _rule_forecast_spike(
    forecast_rows: list[ForecastRecord],
    actual_last_30: float,
    contract: Optional[Contract],
) -> Optional[Recommendation]:
    if not forecast_rows or actual_last_30 < 10:
        return None

    forecast_total = sum(r.predicted_kwh for r in forecast_rows[:30])
    if forecast_total <= 0:
        return None

    delta_pct = (forecast_total - actual_last_30) / actual_last_30
    if abs(delta_pct) < 0.12:
        return None

    rate = (contract.energy_rate_p1_kwh or contract.energy_rate_kwh or 0.15) if contract else 0.15
    cost_delta = (forecast_total - actual_last_30) * rate
    direction = "up" if delta_pct > 0 else "down"

    if direction == "up":
        return Recommendation(
            id="forecast_spike",
            type="forecast",
            title=f"Consumption forecast is {round(delta_pct * 100)}% higher than last month",
            detail=(
                f"Your model predicts {forecast_total:.0f} kWh over the next 30 days vs "
                f"{actual_last_30:.0f} kWh last month. That's ~€{abs(cost_delta):.0f} more on your bill. "
                f"Check for new high-draw appliances or heating/cooling changes."
            ),
            potential_saving_eur=round(abs(cost_delta), 2),
            confidence="medium",
            supporting_data={
                "forecast_kwh_30d": round(forecast_total, 1),
                "actual_kwh_30d": round(actual_last_30, 1),
                "delta_pct": round(delta_pct, 3),
            },
        )
    else:
        return Recommendation(
            id="forecast_down",
            type="forecast",
            title=f"Consumption on track to drop {round(abs(delta_pct) * 100)}% vs last month",
            detail=(
                f"Good trend — model predicts {forecast_total:.0f} kWh vs {actual_last_30:.0f} kWh last month. "
                f"That's ~€{abs(cost_delta):.0f} in savings if it holds."
            ),
            potential_saving_eur=0.0,
            confidence="medium",
            supporting_data={
                "forecast_kwh_30d": round(forecast_total, 1),
                "actual_kwh_30d": round(actual_last_30, 1),
                "delta_pct": round(delta_pct, 3),
            },
        )


# ---------------------------------------------------------------------------
# Rule: anomaly alert
# ---------------------------------------------------------------------------

def _rule_anomaly_alert(anomalies: list[AnomalyRecord]) -> Optional[Recommendation]:
    if len(anomalies) < 2:
        return None

    worst = max(anomalies, key=lambda a: a.z_score)
    dates_str = ", ".join(str(a.anomaly_date) for a in sorted(anomalies, key=lambda a: a.anomaly_date))

    return Recommendation(
        id="anomaly_alert",
        type="anomaly",
        title=f"{len(anomalies)} unusual consumption spikes in the last 14 days",
        detail=(
            f"Detected on: {dates_str}. "
            f"Worst spike: {worst.actual_kwh:.1f} kWh vs predicted {worst.predicted_kwh:.1f} kWh "
            f"(z={worst.z_score:.1f}). May indicate a stuck appliance, HVAC fault, or data error."
        ),
        potential_saving_eur=round(sum(max(a.residual_kwh, 0) for a in anomalies) * 0.15, 2),
        confidence="high",
        supporting_data={
            "anomaly_count": len(anomalies),
            "anomaly_dates": [str(a.anomaly_date) for a in anomalies],
            "max_z_score": round(worst.z_score, 2),
        },
    )


# ---------------------------------------------------------------------------
# Rule: tariff savings
# ---------------------------------------------------------------------------

def _rule_tariff_savings(
    hourly: list[tuple[datetime, float]], contract: Optional[Contract]
) -> Optional[Recommendation]:
    if not contract or not hourly:
        return None

    p1_rate = contract.energy_rate_p1_kwh or 0.0
    p2_rate = contract.energy_rate_p2_kwh or 0.0
    if not p1_rate or not p2_rate:
        return None

    days = len({ts.date() for ts, _ in hourly}) or 1
    monthly_factor = 30.0 / days

    p1_kwh = sum(kwh for ts, kwh in hourly if ts.weekday() < 5 and ts.hour in _P1_HOURS) * monthly_factor
    p2_kwh = sum(kwh for ts, kwh in hourly if not (ts.weekday() < 5 and ts.hour in _P1_HOURS)) * monthly_factor
    total_kwh = (p1_kwh + p2_kwh) or 1.0

    current_cost = p1_kwh * p1_rate + p2_kwh * p2_rate
    flat_rate = (p1_rate + p2_rate) / 2
    flat_cost = total_kwh * flat_rate

    saving = flat_cost - current_cost
    if saving < 8.0:
        return None

    return Recommendation(
        id="tariff_savings",
        type="tariff",
        title="Your usage pattern suggests a flat-rate tariff might save money",
        detail=(
            f"With your current 2.0TD split (P1: €{p1_rate:.3f}, P2: €{p2_rate:.3f}), "
            f"you pay ~€{current_cost:.0f}/month on energy. A flat-rate tariff at equivalent "
            f"average cost could save ~€{saving:.0f}/month given your peak-heavy pattern."
        ),
        potential_saving_eur=round(saving, 2),
        confidence="low",
        supporting_data={
            "p1_kwh_monthly": round(p1_kwh, 1),
            "p2_kwh_monthly": round(p2_kwh, 1),
            "current_monthly_cost_eur": round(current_cost, 2),
        },
    )


# ---------------------------------------------------------------------------
# Rule: appliance off-peak
# ---------------------------------------------------------------------------

def _rule_appliance_offpeak(
    profile: Optional[UsageProfile],
    hourly: list[tuple[datetime, float]],
    contract: Optional[Contract],
) -> Optional[Recommendation]:
    if not profile or not contract:
        return None

    appliances = profile.appliances or []
    high_draw = [a for a in appliances if a.lower() in ("ev", "electric vehicle", "air conditioning", "ac", "dryer", "tumble dryer")]
    if not high_draw:
        return None

    p1_rate = contract.energy_rate_p1_kwh or 0.0
    p2_rate = contract.energy_rate_p2_kwh or 0.0
    if p1_rate - p2_rate < 0.03:
        return None

    # Estimate savings based on appliance types
    per_appliance_kwh_month = {"ev": 150, "electric vehicle": 150, "air conditioning": 60, "ac": 60, "dryer": 30, "tumble dryer": 30}
    total_shiftable_kwh = sum(per_appliance_kwh_month.get(a.lower(), 20) for a in high_draw)
    saving = total_shiftable_kwh * (p1_rate - p2_rate) * 0.7  # assume 70% currently in peak

    if saving < 5.0:
        return None

    names = ", ".join(set(a.title() for a in high_draw))
    return Recommendation(
        id="appliance_offpeak",
        type="appliance",
        title=f"Schedule {names} during off-peak hours",
        detail=(
            f"Your profile includes high-draw appliances ({names}). "
            f"Running them after 22h or before 10h (P2: €{p2_rate:.3f}/kWh) instead of peak "
            f"(P1: €{p1_rate:.3f}/kWh) could save ~€{saving:.0f}/month."
        ),
        potential_saving_eur=round(saving, 2),
        confidence="medium",
        supporting_data={
            "high_draw_appliances": high_draw,
            "estimated_shiftable_kwh_month": round(total_shiftable_kwh, 1),
            "p1_rate_eur_kwh": p1_rate,
            "p2_rate_eur_kwh": p2_rate,
        },
    )


# ---------------------------------------------------------------------------
# Rule: bill on track
# ---------------------------------------------------------------------------

def _rule_bill_on_track(
    forecast_rows: list[ForecastRecord],
    actual_last_30: float,
    contract: Optional[Contract],
) -> Optional[Recommendation]:
    if not forecast_rows:
        return None

    today = date.today()
    days_in_month = 30
    days_elapsed = min(today.day, days_in_month)
    days_remaining = days_in_month - days_elapsed

    if days_remaining <= 0:
        return None

    remaining_forecast = sum(r.predicted_kwh for r in forecast_rows[:days_remaining])
    rate = (contract.energy_rate_p1_kwh or contract.energy_rate_kwh or 0.15) if contract else 0.15

    mtd_cost = actual_last_30 / days_in_month * days_elapsed * rate  # rough MTD cost
    projected_remaining_cost = remaining_forecast * rate
    projected_total = mtd_cost + projected_remaining_cost

    return Recommendation(
        id="bill_on_track",
        type="forecast",
        title=f"Projected bill this month: ~€{projected_total:.0f}",
        detail=(
            f"{days_remaining} days remaining. Forecast: {remaining_forecast:.0f} kWh to go. "
            f"Estimated remaining energy cost: €{projected_remaining_cost:.0f}. "
            f"Total projected: ~€{projected_total:.0f}."
        ),
        potential_saving_eur=0.0,
        confidence="medium",
        supporting_data={
            "days_remaining": days_remaining,
            "remaining_forecast_kwh": round(remaining_forecast, 1),
            "projected_total_eur": round(projected_total, 2),
        },
    )


# ---------------------------------------------------------------------------
# Rule: weather trend
# ---------------------------------------------------------------------------

def _rule_weather_trend(
    session: Session,
    hourly: list[tuple[datetime, float]],
    home_weather_location_id: Optional[uuid.UUID],
) -> Optional[Recommendation]:
    if not hourly or not home_weather_location_id:
        return None

    # Get recent weather
    since = date.today() - timedelta(days=60)
    weather_rows = session.exec(
        select(WeatherRecord)
        .where(
            WeatherRecord.location_id == home_weather_location_id,
            WeatherRecord.record_date >= since,
        )
        .order_by(WeatherRecord.record_date)
    ).all()

    if len(weather_rows) < 14:
        return None

    # Build daily consumption map
    daily_kwh: dict[date, float] = {}
    for ts, kwh in hourly:
        d = ts.date()
        daily_kwh[d] = daily_kwh.get(d, 0.0) + kwh

    temps = []
    kwhs = []
    for wr in weather_rows:
        if wr.record_date in daily_kwh:
            temps.append(wr.temp_mean_c)
            kwhs.append(daily_kwh[wr.record_date])

    if len(temps) < 10:
        return None

    # Pearson correlation
    corr = float(np.corrcoef(temps, kwhs)[0, 1])
    if abs(corr) < 0.5:
        return None

    direction = "colder" if corr < 0 else "warmer"
    driver = "heating" if corr < 0 else "cooling"

    return Recommendation(
        id="weather_sensitivity",
        type="weather",
        title=f"Your consumption strongly tracks temperature (r={corr:.2f})",
        detail=(
            f"As it gets {direction}, your usage rises significantly — likely driven by {driver}. "
            f"Improving insulation or upgrading to a more efficient heat pump could reduce this sensitivity."
        ),
        potential_saving_eur=0.0,
        confidence="medium" if abs(corr) > 0.65 else "low",
        supporting_data={
            "temp_consumption_correlation": round(corr, 3),
            "data_points": len(temps),
        },
    )


# ---------------------------------------------------------------------------
# Thompson Sampling ranker
# ---------------------------------------------------------------------------

def _thompson_rank(
    recs: list[Recommendation],
    session: Session,
    home_id: uuid.UUID,
) -> list[Recommendation]:
    if not recs:
        return recs

    # Pull feedback counts per recommendation_id for this home
    feedback_rows = session.exec(
        select(RecommendationFeedback)
        .where(RecommendationFeedback.home_id == home_id)
    ).all()

    counts: dict[str, dict[str, int]] = {}
    for fb in feedback_rows:
        rid = fb.recommendation_id
        if rid not in counts:
            counts[rid] = {"success": 0, "total": 0}
        counts[rid]["total"] += 1
        if fb.action in _POSITIVE_ACTIONS:
            counts[rid]["success"] += 1

    def sample_score(rec: Recommendation) -> float:
        c = counts.get(rec.id, {"success": 0, "total": 0})
        successes = c["success"]
        failures = c["total"] - successes
        # Beta(alpha, beta) via Gamma ratio — cold start: both = 1 → uniform
        a = successes + 1
        b = failures + 1
        g1 = np.random.gamma(a, 1.0)
        g2 = np.random.gamma(b, 1.0)
        return float(g1 / (g1 + g2)) if (g1 + g2) > 0 else 0.5

    # Primary sort: Thompson sample (exploration/exploitation)
    # Tiebreak: potential_saving_eur
    return sorted(recs, key=lambda r: (sample_score(r), r.potential_saving_eur), reverse=True)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def generate_recommendations(
    session: Session,
    home_id: uuid.UUID,
    weather_location_id: Optional[uuid.UUID] = None,
) -> list[Recommendation]:
    sp_ids = _get_supply_point_ids(session, home_id)
    contract = _get_active_contract(session, sp_ids)
    hourly = _get_hourly_consumption(session, sp_ids, days=60)
    forecast_rows = _get_forecast_rows(session, home_id)
    anomalies = _get_recent_anomalies(session, home_id)
    profile = _get_usage_profile(session, home_id)
    actual_last_30 = _get_actual_last_30_days(session, sp_ids)

    candidates: list[Recommendation] = []

    for rule_fn, args in [
        (_rule_timing_shift, (hourly, contract)),
        (_rule_forecast_spike, (forecast_rows, actual_last_30, contract)),
        (_rule_anomaly_alert, (anomalies,)),
        (_rule_tariff_savings, (hourly, contract)),
        (_rule_appliance_offpeak, (profile, hourly, contract)),
        (_rule_bill_on_track, (forecast_rows, actual_last_30, contract)),
        (_rule_weather_trend, (session, hourly, weather_location_id)),
    ]:
        rec = rule_fn(*args)
        if rec is not None:
            candidates.append(rec)

    ranked = _thompson_rank(candidates, session, home_id)
    return ranked[:5]
