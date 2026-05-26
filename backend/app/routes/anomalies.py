import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.deps import current_user
from app.db.database import get_session
from app.models import Home
from app.models.anomaly_record import AnomalyRecord

router = APIRouter(prefix="/homes", tags=["anomalies"])


class AnomalyOut(BaseModel):
    date: date
    actual_kwh: float
    predicted_kwh: float
    lower_kwh: float
    upper_kwh: float
    residual_kwh: float
    z_score: float
    is_anomaly: bool


@router.get("/{home_id}/anomalies", response_model=list[AnomalyOut])
def get_anomalies(
    home_id: uuid.UUID,
    days: int = 90,
    only_anomalies: bool = True,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    home = session.get(Home, home_id)
    if not home or home.user_id != user_id:
        raise HTTPException(status_code=404, detail="Home not found")

    since = date.today() - timedelta(days=days)

    query = (
        select(AnomalyRecord)
        .where(
            AnomalyRecord.home_id == home_id,
            AnomalyRecord.anomaly_date >= since,
        )
        .order_by(AnomalyRecord.anomaly_date.desc())
    )
    if only_anomalies:
        query = query.where(AnomalyRecord.is_anomaly == True)  # noqa: E712

    records = session.exec(query).all()

    return [
        AnomalyOut(
            date=r.anomaly_date,
            actual_kwh=r.actual_kwh,
            predicted_kwh=r.predicted_kwh,
            lower_kwh=r.lower_kwh,
            upper_kwh=r.upper_kwh,
            residual_kwh=r.residual_kwh,
            z_score=r.z_score,
            is_anomaly=r.is_anomaly,
        )
        for r in records
    ]
