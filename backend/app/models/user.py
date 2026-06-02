import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .home import Home
    from .datadis_credential import DatadisCredential
    from .datadis_sync_job import DatadisSyncJob


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

    homes: List["Home"] = Relationship(back_populates="user")
    credential: Optional["DatadisCredential"] = Relationship(back_populates="user")
    sync_jobs: List["DatadisSyncJob"] = Relationship(back_populates="user")
