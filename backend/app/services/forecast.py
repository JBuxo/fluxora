import uuid
from datetime import date, datetime, timezone

import numpy as np
import pandas as pd
from prophet import Prophet
from sqlmodel import Session, select

from app.models import ConsumptionRecord, Home, SupplyPoint
from app.models.anomaly_record import AnomalyRecord
from app.models.forecast_record import ForecastRecord
from app.models.usage_profile import UsageProfile
from app.models.weather_record import WeatherRecord

ANOMALY_Z_THRESHOLD = 2.0

# Spain 2.0TD peak hours per weekday (P1: 10-14, 18-22 → 8 hours / 24)
_TARIFF_WEEKDAY_SCORE = 8.0 / 24.0


def _occupants_to_float(value: str | None) -> float:
    if not value:
        return 2.0
    digit = value.strip().replace("+", "")[0]
    try:
        return float(digit)
    except ValueError:
        return 2.0


def _wfh_to_float(value: str | None) -> float:
    mapping = {"yes": 1.0, "always": 1.0, "sometimes": 0.5, "no": 0.0, "never": 0.0}
    return mapping.get((value or "").lower(), 0.0)


def _heating_to_float(value: str | None) -> float:
    if not value:
        return 0.0
    v = value.lower()
    if "electric" in v or "heat pump" in v:
        return 1.0
    return 0.0


def _hot_water_to_float(value: str | None) -> float:
    if not value:
        return 0.0
    v = value.lower()
    if "electric boiler" in v:
        return 1.0
    if "heat pump" in v:
        return 0.7
    if "solar" in v:
        return 0.1
    return 0.0


def _appliances_to_float(value: list | None) -> float:
    if not value:
        return 0.0
    weights = {
        "electric vehicle": 3.0,
        "air conditioning": 2.0,
        "tumble dryer": 1.0,
        "dishwasher": 0.5,
        "solar panels": -1.0,
    }
    total = 0.0
    for item in value:
        total += weights.get(item.lower(), 0.3)
    return total


def _active_hours(wake: str | None, sleep: str | None) -> float:
    wake_map = {"before 7:00": 6.0, "7:00–9:00": 8.0, "after 9:00": 10.0}
    sleep_map = {"before 23:00": 22.0, "23:00–01:00": 24.0, "after 01:00": 26.0}
    w = wake_map.get((wake or "").lower(), 7.5)
    s = sleep_map.get((sleep or "").lower(), 23.0)
    return max(s - w, 8.0)


def _tariff_score(ds: pd.Series) -> pd.Series:
    """Daily fraction of hours in P1 (peak) under Spain 2.0TD. Weekends/holidays → 0."""
    return ds.dt.dayofweek.apply(lambda dow: _TARIFF_WEEKDAY_SCORE if dow < 5 else 0.0)


def _load_weather(home_id: uuid.UUID, session: Session) -> dict[date, float]:
    """Returns {date: temp_mean_c} via the home's shared weather location."""
    home = session.get(Home, home_id)
    if not home or not home.weather_location_id:
        return {}
    records = session.exec(
        select(WeatherRecord).where(WeatherRecord.location_id == home.weather_location_id)
    ).all()
    return {r.record_date: r.temp_mean_c for r in records if r.temp_mean_c is not None}


def run_forecast(home_id: uuid.UUID, session: Session) -> int:
    supply_point_ids = [
        sp.id
        for sp in session.exec(select(SupplyPoint).where(SupplyPoint.home_id == home_id)).all()
    ]
    if not supply_point_ids:
        return 0

    records = session.exec(
        select(ConsumptionRecord).where(ConsumptionRecord.supply_point_id.in_(supply_point_ids))
    ).all()
    if not records:
        return 0

    df = pd.DataFrame([{"ds": r.timestamp, "y": r.consumption_kwh} for r in records])
    df["ds"] = pd.to_datetime(df["ds"])
    df = df.groupby(df["ds"].dt.date).agg(y=("y", "sum")).reset_index()
    df.rename(columns={"ds": "ds"}, inplace=True)
    df["ds"] = pd.to_datetime(df["ds"])

    profile = session.exec(
        select(UsageProfile).where(UsageProfile.home_id == home_id)
    ).first()

    p = profile
    occupants = _occupants_to_float(p.occupants if p else None)
    wfh = _wfh_to_float(p.work_from_home if p else None)
    heating = _heating_to_float(p.heating_type if p else None)
    hot_water = _hot_water_to_float(p.hot_water if p else None)
    appliances = _appliances_to_float(p.appliances if p else None)
    active_hrs = _active_hours(p.wake_time if p else None, p.sleep_time if p else None)

    df["occupants"] = occupants
    df["work_from_home"] = wfh
    df["heating_load"] = heating
    df["electric_hot_water"] = hot_water
    df["appliance_load"] = appliances
    df["active_hours"] = active_hrs
    df["tariff_peak"] = _tariff_score(df["ds"])

    # Weather: join temperature, fall back to mean if missing
    weather_map = _load_weather(home_id, session)
    if weather_map:
        fallback_temp = float(np.mean(list(weather_map.values())))
        df["temperature"] = df["ds"].dt.date.map(lambda d: weather_map.get(d, fallback_temp))
    else:
        df["temperature"] = 15.0  # reasonable Spain annual mean
    use_weather = weather_map != {}

    model = Prophet(
        yearly_seasonality=20,
        weekly_seasonality=True,
        daily_seasonality=False,
        interval_width=0.99,
        seasonality_mode="multiplicative",
    )
    model.add_country_holidays(country_name="ES")
    model.add_regressor("occupants")
    model.add_regressor("work_from_home")
    model.add_regressor("heating_load")
    model.add_regressor("electric_hot_water")
    model.add_regressor("appliance_load")
    model.add_regressor("active_hours")
    model.add_regressor("tariff_peak")
    if use_weather:
        model.add_regressor("temperature")
    model.fit(df)

    now = datetime.now(timezone.utc)
    today = date.today()

    # ── Future forecast (rolling 30 days) ────────────────────────────────────
    last_day = today + pd.Timedelta(days=30)
    future_dates = pd.date_range(start=pd.Timestamp(today), end=pd.Timestamp(last_day), freq="D")
    future = pd.DataFrame({"ds": future_dates})
    future["occupants"] = occupants
    future["work_from_home"] = wfh
    future["heating_load"] = heating
    future["electric_hot_water"] = hot_water
    future["appliance_load"] = appliances
    future["active_hours"] = active_hrs
    future["tariff_peak"] = _tariff_score(future["ds"])
    if use_weather:
        fallback_temp = float(np.mean(list(weather_map.values())))
        future["temperature"] = future["ds"].dt.date.map(
            lambda d: weather_map.get(d, fallback_temp)
        )

    forecast = model.predict(future)

    upserted = 0
    for _, row in forecast.iterrows():
        forecast_date = row["ds"].date()
        predicted = max(0.0, float(row["yhat"]))
        lower = max(0.0, float(row["yhat_lower"]))
        upper = max(0.0, float(row["yhat_upper"]))

        existing = session.exec(
            select(ForecastRecord).where(
                ForecastRecord.home_id == home_id,
                ForecastRecord.forecast_date == forecast_date,
            )
        ).first()

        if existing:
            existing.predicted_kwh = predicted
            existing.lower_kwh = lower
            existing.upper_kwh = upper
            existing.run_at = now
            session.add(existing)
        else:
            session.add(ForecastRecord(
                home_id=home_id,
                forecast_date=forecast_date,
                predicted_kwh=predicted,
                lower_kwh=lower,
                upper_kwh=upper,
                run_at=now,
            ))
        upserted += 1

    # ── Historical anomaly detection ─────────────────────────────────────────
    hist_cols = ["ds", "y", "occupants", "work_from_home", "heating_load",
                 "electric_hot_water", "appliance_load", "active_hours", "tariff_peak"]
    if use_weather:
        hist_cols.append("temperature")
    hist = df[hist_cols].copy()
    hist_pred = model.predict(hist)

    residuals = df["y"].values - hist_pred["yhat"].values
    std = float(np.std(residuals)) or 1.0

    for i, row in hist_pred.iterrows():
        actual = float(df.iloc[i]["y"])
        predicted_h = float(row["yhat"])
        lower_h = max(0.0, float(row["yhat_lower"]))
        upper_h = max(0.0, float(row["yhat_upper"]))
        residual = actual - predicted_h
        z = residual / std

        anomaly_date = row["ds"].date()

        existing_a = session.exec(
            select(AnomalyRecord).where(
                AnomalyRecord.home_id == home_id,
                AnomalyRecord.anomaly_date == anomaly_date,
            )
        ).first()

        if existing_a:
            existing_a.actual_kwh = round(actual, 3)
            existing_a.predicted_kwh = round(predicted_h, 3)
            existing_a.lower_kwh = round(lower_h, 3)
            existing_a.upper_kwh = round(upper_h, 3)
            existing_a.residual_kwh = round(residual, 3)
            existing_a.z_score = round(z, 3)
            existing_a.is_anomaly = z >= ANOMALY_Z_THRESHOLD
            existing_a.run_at = now
            session.add(existing_a)
        else:
            session.add(AnomalyRecord(
                home_id=home_id,
                anomaly_date=anomaly_date,
                actual_kwh=round(actual, 3),
                predicted_kwh=round(predicted_h, 3),
                lower_kwh=round(lower_h, 3),
                upper_kwh=round(upper_h, 3),
                residual_kwh=round(residual, 3),
                z_score=round(z, 3),
                is_anomaly=z >= ANOMALY_Z_THRESHOLD,
            ))

    session.commit()
    return upserted
