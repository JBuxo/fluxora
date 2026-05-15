import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .home import Home
    from .contract import Contract
    from .consumption_record import ConsumptionRecord


class SupplyPoint(SQLModel, table=True):
    """Maps to a Datadis CUPS (Código Universal del Punto de Suministro)."""

    __tablename__ = "supply_points"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    home_id: uuid.UUID = Field(foreign_key="homes.id", index=True)
    cups: str = Field(unique=True, index=True)
    address: str
    distributor_name: str
    active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_synced_at: Optional[datetime] = None

    home: Optional["Home"] = Relationship(back_populates="supply_points")
    contracts: List["Contract"] = Relationship(back_populates="supply_point")
    consumption_records: List["ConsumptionRecord"] = Relationship(back_populates="supply_point")
