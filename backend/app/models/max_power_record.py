import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .supply_point import SupplyPoint


class MaxPowerRecord(SQLModel, table=True):
    __tablename__ = "max_power_records"
    __table_args__ = (
        UniqueConstraint("supply_point_id", "timestamp", "period", name="uq_max_power_supply_ts_period"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    supply_point_id: uuid.UUID = Field(foreign_key="supply_points.id", index=True)
    timestamp: datetime = Field(index=True)
    max_power_kw: float
    period: Optional[str] = None

    supply_point: Optional["SupplyPoint"] = Relationship(back_populates="max_power_records")
