import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class RecommendationFeedback(SQLModel, table=True):
    __tablename__ = "recommendation_feedback"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    home_id: uuid.UUID = Field(foreign_key="homes.id", index=True)
    recommendation_id: str = Field(index=True)  # e.g. "timing_shift"
    recommendation_type: str  # e.g. "timing", "forecast", "tariff"
    action: str  # "accepted" | "dismissed" | "already_doing" | "not_useful"
    context_json: Optional[str] = Field(default=None)  # JSON snapshot of supporting_data at display time
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
