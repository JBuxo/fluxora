import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

from .enums import ConsumptionSource

if TYPE_CHECKING:
    from .supply_point import SupplyPoint


class ConsumptionRecord(SQLModel, table=True):
    __tablename__ = "consumption_records"
    __table_args__ = (
        UniqueConstraint("supply_point_id", "timestamp", name="uq_consumption_supply_timestamp"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    supply_point_id: uuid.UUID = Field(foreign_key="supply_points.id", index=True)
    timestamp: datetime = Field(index=True)
    consumption_kwh: float
    cost_estimate: Optional[float] = None
    source: ConsumptionSource = Field(default=ConsumptionSource.datadis)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    supply_point: Optional["SupplyPoint"] = Relationship(back_populates="consumption_records")
