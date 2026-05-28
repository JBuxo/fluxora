import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .user import User
    from .supply_point import SupplyPoint
    from .usage_profile import UsageProfile


class Home(SQLModel, table=True):
    __tablename__ = "homes"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    name: str
    address: str
    weather_location_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="weather_locations.id", index=True
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

    user: Optional["User"] = Relationship(back_populates="homes")
    supply_points: List["SupplyPoint"] = Relationship(back_populates="home")
    usage_profile: Optional["UsageProfile"] = Relationship(back_populates="home")
