import uuid
from datetime import date, datetime, timezone

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class ForecastRecord(SQLModel, table=True):
    __tablename__ = "forecast_records"
    __table_args__ = (
        UniqueConstraint("home_id", "forecast_date", name="uq_forecast_home_date"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    home_id: uuid.UUID = Field(foreign_key="homes.id", index=True)
    forecast_date: date = Field(index=True)
    predicted_kwh: float
    lower_kwh: float
    upper_kwh: float
    run_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
