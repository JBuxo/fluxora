import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

from .enums import SyncStatus, SyncType

if TYPE_CHECKING:
    from .user import User


class DatadisSyncJob(SQLModel, table=True):
    __tablename__ = "datadis_sync_jobs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    status: SyncStatus = Field(default=SyncStatus.pending)
    type: SyncType
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: Optional["User"] = Relationship(back_populates="sync_jobs")
