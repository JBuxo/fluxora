import os
import uuid
from datetime import datetime, timezone

from cryptography.fernet import Fernet, InvalidToken
from sqlmodel import Session, select

from app.models.datadis_credential import DatadisCredential
from app.models.enums import CredentialStatus

_KEY_ENV = "CREDENTIAL_ENCRYPTION_KEY"


def _fernet() -> Fernet:
    key = os.getenv(_KEY_ENV)
    if not key:
        raise RuntimeError(f"{_KEY_ENV} env var not set")
    return Fernet(key.encode())


def store_credentials(user_id: uuid.UUID, nif: str, password: str, session: Session) -> DatadisCredential:
    f = _fernet()
    dni_enc = f.encrypt(nif.encode()).decode()
    pwd_enc = f.encrypt(password.encode()).decode()
    now = datetime.now(timezone.utc)

    cred = session.exec(
        select(DatadisCredential).where(DatadisCredential.user_id == user_id)
    ).first()

    if cred:
        cred.dni_encrypted = dni_enc
        cred.password_encrypted = pwd_enc
        cred.status = CredentialStatus.active
        cred.updated_at = now
    else:
        cred = DatadisCredential(
            user_id=user_id,
            dni_encrypted=dni_enc,
            password_encrypted=pwd_enc,
            status=CredentialStatus.active,
        )

    session.add(cred)
    session.flush()
    return cred


def load_credentials(user_id: uuid.UUID, session: Session) -> tuple[str, str] | None:
    """Returns (nif, password) or None if not found / decryption fails."""
    cred = session.exec(
        select(DatadisCredential).where(
            DatadisCredential.user_id == user_id,
            DatadisCredential.status == CredentialStatus.active,
        )
    ).first()
    if not cred:
        return None
    try:
        f = _fernet()
        nif = f.decrypt(cred.dni_encrypted.encode()).decode()
        password = f.decrypt(cred.password_encrypted.encode()).decode()
        return nif, password
    except (InvalidToken, Exception):
        return None
