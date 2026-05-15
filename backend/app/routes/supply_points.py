import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.deps import current_user
from app.db.database import get_session
from app.models import ConsumptionRecord, Contract, Home, SupplyPoint

router = APIRouter(prefix="/supply-points", tags=["supply-points"])


class SupplyPointCreate(BaseModel):
    cups: str
    address: str
    distributor_name: str


def _owned_supply_point(
    sp_id: uuid.UUID,
    user_id: uuid.UUID,
    session: Session,
) -> SupplyPoint:
    sp = session.get(SupplyPoint, sp_id)
    if not sp:
        raise HTTPException(status_code=404, detail="Supply point not found")
    home = session.get(Home, sp.home_id)
    if not home or home.user_id != user_id:
        raise HTTPException(status_code=404, detail="Supply point not found")
    return sp


@router.post("/homes/{home_id}/supply-points", response_model=SupplyPoint, status_code=201)
def create_supply_point(
    home_id: uuid.UUID,
    body: SupplyPointCreate,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    home = session.get(Home, home_id)
    if not home or home.user_id != user_id:
        raise HTTPException(status_code=404, detail="Home not found")
    sp = SupplyPoint(home_id=home_id, **body.model_dump())
    session.add(sp)
    session.commit()
    session.refresh(sp)
    return sp


@router.get("/{sp_id}", response_model=SupplyPoint)
def get_supply_point(
    sp_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    return _owned_supply_point(sp_id, user_id, session)


@router.get("/{sp_id}/contracts", response_model=List[Contract])
def list_contracts(
    sp_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    _owned_supply_point(sp_id, user_id, session)
    return session.exec(select(Contract).where(Contract.supply_point_id == sp_id)).all()


@router.get("/{sp_id}/consumption", response_model=List[ConsumptionRecord])
def list_consumption(
    sp_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
    from_dt: Optional[datetime] = Query(None, description="ISO datetime, inclusive"),
    to_dt: Optional[datetime] = Query(None, description="ISO datetime, inclusive"),
):
    _owned_supply_point(sp_id, user_id, session)
    query = select(ConsumptionRecord).where(ConsumptionRecord.supply_point_id == sp_id)
    if from_dt:
        query = query.where(ConsumptionRecord.timestamp >= from_dt)
    if to_dt:
        query = query.where(ConsumptionRecord.timestamp <= to_dt)
    query = query.order_by(ConsumptionRecord.timestamp)
    return session.exec(query).all()
