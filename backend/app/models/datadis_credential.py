import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

from .enums import CredentialStatus

if TYPE_CHECKING:
    from .user import User


class DatadisCredential(SQLModel, table=True):
    """
    Stores Datadis login credentials encrypted at rest.
    Never expose dni_encrypted or password_encrypted in API responses.
    Encrypt/decrypt in the service layer only; values travel in-memory only.
    """

    __tablename__ = "datadis_credentials"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", unique=True, index=True)
    dni_encrypted: str
    password_encrypted: str
    encryption_key_id: Optional[str] = None
    status: CredentialStatus = Field(default=CredentialStatus.active)
    last_validated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

    user: Optional["User"] = Relationship(back_populates="credential")
