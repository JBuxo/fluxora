import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class WeatherLocation(SQLModel, table=True):
    __tablename__ = "weather_locations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    # Rounded to 0.5° grid (~50 km) so nearby homes share one location
    latitude: float = Field(index=True)
    longitude: float = Field(index=True)
    label: Optional[str] = None  # human-readable e.g. "Madrid"
    last_synced_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
