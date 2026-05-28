import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.deps import current_user
from app.db.database import get_session
from app.models import Home
from app.models.usage_profile import UsageProfile

router = APIRouter(prefix="/homes/{home_id}/usage-profile", tags=["usage-profile"])


class UsageProfileIn(BaseModel):
    occupants: Optional[str] = None
    home_size: Optional[str] = None
    heating_type: Optional[str] = None
    hot_water: Optional[str] = None
    appliances: Optional[List[str]] = None
    home_days: Optional[List[str]] = None
    work_from_home: Optional[str] = None
    wake_time: Optional[str] = None
    sleep_time: Optional[str] = None
    laundry_time: Optional[str] = None
    cooking_meals: Optional[List[str]] = None


@router.put("")
def upsert_usage_profile(
    home_id: uuid.UUID,
    body: UsageProfileIn,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    home = session.get(Home, home_id)
    if not home or home.user_id != user_id:
        raise HTTPException(status_code=404, detail="Home not found")

    profile = session.exec(
        select(UsageProfile).where(UsageProfile.home_id == home_id)
    ).first()

    if profile:
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(profile, field, value)
        profile.updated_at = datetime.now(timezone.utc)
    else:
        profile = UsageProfile(home_id=home_id, **body.model_dump())

    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile
