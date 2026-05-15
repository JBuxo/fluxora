import uuid
from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

from .enums import ContractStatus

if TYPE_CHECKING:
    from .supply_point import SupplyPoint


class Contract(SQLModel, table=True):
    __tablename__ = "contracts"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    supply_point_id: uuid.UUID = Field(foreign_key="supply_points.id", index=True)
    contract_number: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    tariff_name: str
    power_kw: Optional[float] = None
    status: ContractStatus = Field(default=ContractStatus.active)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    supply_point: Optional["SupplyPoint"] = Relationship(back_populates="contracts")
