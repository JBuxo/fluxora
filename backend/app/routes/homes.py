import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.deps import current_user
from app.db.database import get_session
from app.models import Home, SupplyPoint


class HomeCreate(BaseModel):
    name: str
    address: str


router = APIRouter(prefix="/homes", tags=["homes"])


@router.get("", response_model=List[Home])
def list_homes(
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    return session.exec(select(Home).where(Home.user_id == user_id)).all()


@router.post("", response_model=Home, status_code=201)
def create_home(
    body: HomeCreate,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    home = Home(user_id=user_id, name=body.name, address=body.address)
    session.add(home)
    session.commit()
    session.refresh(home)
    return home


@router.get("/{home_id}", response_model=Home)
def get_home(
    home_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    home = session.get(Home, home_id)
    if not home or home.user_id != user_id:
        raise HTTPException(status_code=404, detail="Home not found")
    return home


@router.delete("/{home_id}", status_code=204)
def delete_home(
    home_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    home = session.get(Home, home_id)
    if not home or home.user_id != user_id:
        raise HTTPException(status_code=404, detail="Home not found")
    session.delete(home)
    session.commit()


@router.get("/{home_id}/supply-points", response_model=List[SupplyPoint])
def list_supply_points(
    home_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    home = session.get(Home, home_id)
    if not home or home.user_id != user_id:
        raise HTTPException(status_code=404, detail="Home not found")
    return session.exec(select(SupplyPoint).where(SupplyPoint.home_id == home_id)).all()
