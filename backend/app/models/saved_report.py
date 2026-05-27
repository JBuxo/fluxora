import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class SavedReport(SQLModel, table=True):
    __tablename__ = "saved_reports"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    supply_point_id: uuid.UUID = Field(index=True)
    user_id: uuid.UUID = Field(index=True)
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    period_from: datetime
    period_to: datetime
    period_days: int
    total_kwh: float
    record_count: int
    report_data: str  # JSON blob
