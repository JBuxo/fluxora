import uuid
from datetime import date, datetime, timezone

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class AnomalyRecord(SQLModel, table=True):
    __tablename__ = "anomaly_records"
    __table_args__ = (
        UniqueConstraint("home_id", "anomaly_date", name="uq_anomaly_home_date"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    home_id: uuid.UUID = Field(foreign_key="homes.id", index=True)
    anomaly_date: date = Field(index=True)
    actual_kwh: float
    predicted_kwh: float
    lower_kwh: float
    upper_kwh: float
    residual_kwh: float
    z_score: float
    is_anomaly: bool = Field(default=False)
    run_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
