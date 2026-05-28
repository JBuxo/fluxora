import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.deps import current_user
from app.db.database import get_session
from app.models import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=User)
def get_me(
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
