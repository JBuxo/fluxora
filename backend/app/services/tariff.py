"""
Tariff engine for Spain 2.0TD residential tariff.

Takes hourly consumption forecasts and a Contract, returns a full bill
breakdown with low/high range derived from Prophet confidence bands.
"""

import json
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Sequence

from app.models.contract import Contract
from app.models.consumption_record import ConsumptionRecord
from app.models.forecast_record import ForecastRecord

# Spain 2.0TD peak hours (local time, Mon-Fri only)
_PEAK_HOURS = frozenset(range(10, 14)) | frozenset(range(18, 22))


def is_peak_hour(dt: datetime) -> bool:
    """Return True if dt falls in a 2.0TD P1 (peak) hour."""
    return dt.weekday() < 5 and dt.hour in _PEAK_HOURS


@dataclass
class BillBreakdown:
    # Energy component
    energy_p1_kwh: float
    energy_p2_kwh: float
    energy_cost_eur: float

    # Power term
    power_cost_eur: float

    # Surcharges (applied to energy subtotal)
    cargos_eur: float

    # Fixed monthly charges
    meter_rent_eur: float

    # Taxes
    iee_eur: float
    iva_eur: float

    # Final totals
    total_eur: float
    total_low_eur: float   # based on Prophet lower band
    total_high_eur: float  # based on Prophet upper band


HourlyProfile = dict[tuple[int, int], float]  # (weekday, hour) -> fraction of daily total


def build_hourly_profile(records: Sequence[ConsumptionRecord]) -> HourlyProfile:
    """
    Compute average hourly fraction of daily consumption per (weekday, hour) bucket.

    Used to disaggregate daily Prophet forecasts into pseudo-hourly values for
    P1/P2 tariff classification without changing the ForecastRecord schema.
    """
    daily_totals: dict[date, float] = defaultdict(float)
    hourly_totals: dict[tuple[int, int], float] = defaultdict(float)
    hourly_counts: dict[tuple[int, int], int] = defaultdict(int)

    for r in records:
        ts = r.timestamp
        if ts.tzinfo is not None:
            ts = ts.replace(tzinfo=None)
        d = ts.date()
        daily_totals[d] += r.consumption_kwh
        key = (ts.weekday(), ts.hour)
        hourly_totals[key] += r.consumption_kwh
        hourly_counts[key] += 1

    # Compute fraction: avg hourly kWh / avg daily kWh for that weekday
    weekday_daily: dict[int, list[float]] = defaultdict(list)
    for d, total in daily_totals.items():
        weekday_daily[d.weekday()].append(total)

    avg_daily_by_weekday = {wd: sum(v) / len(v) for wd, v in weekday_daily.items()}

    profile: HourlyProfile = {}
    for (wd, hr), total in hourly_totals.items():
        count = hourly_counts[(wd, hr)]
        avg_hourly = total / count
        avg_daily = avg_daily_by_weekday.get(wd, 1.0) or 1.0
        profile[(wd, hr)] = avg_hourly / avg_daily

    # Fill any missing (weekday, hour) slots with uniform 1/24
    for wd in range(7):
        for hr in range(24):
            if (wd, hr) not in profile:
                profile[(wd, hr)] = 1.0 / 24.0

    # Normalise so each weekday sums to 1.0
    for wd in range(7):
        total_frac = sum(profile.get((wd, hr), 0.0) for hr in range(24))
        if total_frac > 0:
            for hr in range(24):
                profile[(wd, hr)] = profile[(wd, hr)] / total_frac

    return profile


def disaggregate_daily(
    daily_records: Sequence[ForecastRecord],
    profile: HourlyProfile,
) -> list[tuple[datetime, float, float, float]]:
    """
    Expand daily ForecastRecords into pseudo-hourly (timestamp, pred, lower, upper) tuples.

    Each day's kWh is distributed across 24 hours using the historical profile.
    """
    result: list[tuple[datetime, float, float, float]] = []
    for rec in daily_records:
        d = rec.forecast_date
        base = datetime(d.year, d.month, d.day)
        for hr in range(24):
            ts = base + timedelta(hours=hr)
            frac = profile.get((ts.weekday(), hr), 1.0 / 24.0)
            result.append((
                ts,
                rec.predicted_kwh * frac,
                rec.lower_kwh * frac,
                rec.upper_kwh * frac,
            ))
    return result


def compute_bill(
    hourly_forecast: list[tuple[datetime, float, float, float]],
    contract: Contract,
    days_in_period: int,
) -> BillBreakdown:
    """
    Compute a full bill breakdown from hourly forecast data.

    Args:
        hourly_forecast: list of (timestamp, predicted_kwh, lower_kwh, upper_kwh)
        contract: active Contract with tariff rate fields populated
        days_in_period: number of days the billing period spans (for power term)

    Returns:
        BillBreakdown with central estimate and low/high range.
    """
    p1_kwh = p2_kwh = 0.0
    p1_low = p2_low = 0.0
    p1_high = p2_high = 0.0

    for ts, pred, lower, upper in hourly_forecast:
        if is_peak_hour(ts):
            p1_kwh += pred
            p1_low += lower
            p1_high += upper
        else:
            p2_kwh += pred
            p2_low += lower
            p2_high += upper

    rate_p1 = contract.energy_rate_p1_kwh or contract.energy_rate_kwh or 0.0
    rate_p2 = contract.energy_rate_p2_kwh or contract.energy_rate_kwh or 0.0

    powers_raw = contract.contracted_powers_kw
    powers = json.loads(powers_raw) if isinstance(powers_raw, str) else list(powers_raw or [])
    peak_kw = float(powers[0]) if powers else 0.0
    valley_kw = float(powers[1]) if len(powers) > 1 else peak_kw

    power_cost = round(
        (peak_kw * (contract.power_rate_peak_kw_day or 0.0) +
         valley_kw * (contract.power_rate_valley_kw_day or 0.0)) * days_in_period,
        4,
    )

    def _totals(p1: float, p2: float) -> tuple[float, float, float, float, float, float]:
        energy_cost = p1 * rate_p1 + p2 * rate_p2
        cargos = energy_cost * (contract.cargos_pct / 100.0)
        meter_rent = contract.meter_rent_eur_month
        pre_iee = energy_cost + power_cost + cargos + meter_rent
        iee = pre_iee * (contract.iee_pct / 100.0)
        iva_base = pre_iee + iee
        iva = iva_base * (contract.iva_pct / 100.0)
        total = iva_base + iva
        return energy_cost, cargos, meter_rent, iee, iva, total

    energy_cost, cargos, meter_rent, iee, iva, total = _totals(p1_kwh, p2_kwh)
    _, _, _, _, _, total_low = _totals(p1_low, p2_low)
    _, _, _, _, _, total_high = _totals(p1_high, p2_high)

    return BillBreakdown(
        energy_p1_kwh=round(p1_kwh, 3),
        energy_p2_kwh=round(p2_kwh, 3),
        energy_cost_eur=round(energy_cost, 2),
        power_cost_eur=round(power_cost, 2),
        cargos_eur=round(cargos, 2),
        meter_rent_eur=round(meter_rent, 2),
        iee_eur=round(iee, 2),
        iva_eur=round(iva, 2),
        total_eur=round(total, 2),
        total_low_eur=round(total_low, 2),
        total_high_eur=round(total_high, 2),
    )
