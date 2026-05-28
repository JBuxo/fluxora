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
    # Enriched from Datadis get_contract_detail
    code_fare: Optional[str] = None          # e.g. "2.0TD"
    contracted_powers_kw: Optional[str] = None  # JSON-encoded list of floats per period
    time_discrimination: Optional[str] = None   # e.g. "DHA", "DHS", or None
    marketer: Optional[str] = None
    # Energy rates — 2.0TD has distinct peak (P1) and valley (P2) prices
    energy_rate_p1_kwh: Optional[float] = None   # peak: Mon-Fri 10-14h, 18-22h
    energy_rate_p2_kwh: Optional[float] = None   # all other hours
    energy_rate_kwh: Optional[float] = None      # kept for legacy reads; prefer p1/p2
    power_rate_peak_kw_day: Optional[float] = None
    power_rate_valley_kw_day: Optional[float] = None
    # Taxes and surcharges (update when regulated rates change)
    iee_pct: float = Field(default=5.11269)       # Impuesto Especial Electricidad
    iva_pct: float = Field(default=10.0)           # IVA (10% current; was 21% pre-Apr-2026)
    meter_rent_eur_month: float = Field(default=0.0)   # Alquiler de equipos
    cargos_pct: float = Field(default=0.0)             # Cargos y tasas as % of energy subtotal
    status: ContractStatus = Field(default=ContractStatus.active)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    supply_point: Optional["SupplyPoint"] = Relationship(back_populates="contracts")
