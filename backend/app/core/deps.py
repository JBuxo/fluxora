import uuid

from fastapi import Header, HTTPException


def current_user(authorization: str = Header(...)) -> uuid.UUID:
    """
    Fake auth: Authorization: Bearer <user_uuid>
    The token IS the user's UUID. Swap this for real verify_token when Supabase auth is wired.
    """
    try:
        parts = authorization.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise ValueError
        return uuid.UUID(parts[1])
    except (ValueError, AttributeError):
        raise HTTPException(status_code=401, detail="Invalid token")
