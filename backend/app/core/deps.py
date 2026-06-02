import uuid

from fastapi import Header, HTTPException
from app.core.auth import verify_token


def current_user(authorization: str = Header(...)) -> uuid.UUID:
    payload = verify_token(authorization)
    try:
        return uuid.UUID(payload["sub"])
    except (KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token subject")
