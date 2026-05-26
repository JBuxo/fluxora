import uuid
from datetime import date, datetime, timezone

import numpy as np
import pandas as pd
from prophet import Prophet
from sqlmodel import Session, select

from app.models import ConsumptionRecord, SupplyPoint
from app.models.anomaly_record import AnomalyRecord
from app.models.forecast_record import ForecastRecord
from app.models.usage_profile import UsageProfile

ANOMALY_Z_THRESHOLD = 2.0


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

    occupants = _occupants_to_float(profile.occupants if profile else None)
    wfh = _wfh_to_float(profile.work_from_home if profile else None)

    df["occupants"] = occupants
    df["work_from_home"] = wfh

    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        interval_width=0.99,
    )
    model.add_regressor("occupants")
    model.add_regressor("work_from_home")
    model.fit(df)

    now = datetime.now(timezone.utc)
    today = date.today()

    # ── Future forecast (rolling 30 days) ────────────────────────────────────
    last_day = today + pd.Timedelta(days=30)
    future_dates = pd.date_range(start=pd.Timestamp(today), end=pd.Timestamp(last_day), freq="D")
    future = pd.DataFrame({"ds": future_dates})
    future["occupants"] = occupants
    future["work_from_home"] = wfh

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
    hist = df[["ds", "y", "occupants", "work_from_home"]].copy()
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
                run_at=now,
            ))

    session.commit()
    return upserted
