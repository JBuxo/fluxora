import uuid
from datetime import date, datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class WeatherRecord(SQLModel, table=True):
    __tablename__ = "weather_records"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    location_id: uuid.UUID = Field(foreign_key="weather_locations.id", index=True)
    record_date: date = Field(index=True)
    temp_max_c: Optional[float] = None
    temp_min_c: Optional[float] = None
    temp_mean_c: Optional[float] = None
    fetched_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
