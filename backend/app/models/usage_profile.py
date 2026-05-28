import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .home import Home


class UsageProfile(SQLModel, table=True):
    __tablename__ = "usage_profiles"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    home_id: uuid.UUID = Field(foreign_key="homes.id", index=True, unique=True)

    occupants: Optional[str] = None
    home_size: Optional[str] = None
    heating_type: Optional[str] = None
    hot_water: Optional[str] = None
    appliances: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    home_days: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    work_from_home: Optional[str] = None
    wake_time: Optional[str] = None
    sleep_time: Optional[str] = None
    laundry_time: Optional[str] = None
    cooking_meals: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

    home: Optional["Home"] = Relationship(back_populates="usage_profile")
