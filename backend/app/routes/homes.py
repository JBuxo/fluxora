import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.deps import current_user
from app.db.database import get_session
from app.models import Contract, Home, SupplyPoint
from app.models.enums import ContractStatus


class HomeCreate(BaseModel):
    name: str
    address: str = ""


class TariffRatesIn(BaseModel):
    energy_rate_kwh: Optional[float] = None
    power_rate_peak_kw_day: Optional[float] = None
    power_rate_valley_kw_day: Optional[float] = None


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


@router.get("/with-contracts", response_model=List[Dict[str, Any]])
def homes_with_contracts(
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    homes = session.exec(select(Home).where(Home.user_id == user_id)).all()
    result = []
    for home in homes:
        sps = session.exec(select(SupplyPoint).where(SupplyPoint.home_id == home.id)).all()
        sp_list = []
        for sp in sps:
            contracts = session.exec(
                select(Contract).where(Contract.supply_point_id == sp.id)
            ).all()
            active = next((c for c in contracts if c.status == ContractStatus.active), None)
            sp_list.append({
                "id": str(sp.id),
                "cups": sp.cups,
                "address": sp.address,
                "active": sp.active,
                "last_synced_at": sp.last_synced_at.isoformat() if sp.last_synced_at else None,
                "active_contract": {
                    "id": str(active.id),
                    "tariff_name": active.tariff_name,
                    "power_kw": active.power_kw,
                } if active else None,
            })
        result.append({
            "id": str(home.id),
            "name": home.name,
            "address": home.address,
            "supply_points": sp_list,
        })
    return result


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


@router.put("/{home_id}/tariff")
def update_tariff_rates(
    home_id: uuid.UUID,
    body: TariffRatesIn,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    home = session.get(Home, home_id)
    if not home or home.user_id != user_id:
        raise HTTPException(status_code=404, detail="Home not found")

    supply_points = session.exec(select(SupplyPoint).where(SupplyPoint.home_id == home_id)).all()
    if not supply_points:
        raise HTTPException(status_code=404, detail="No supply points found — run sync first")

    updated = 0
    for sp in supply_points:
        contract = session.exec(
            select(Contract).where(
                Contract.supply_point_id == sp.id,
                Contract.status == ContractStatus.active,
            )
        ).first()
        if not contract:
            continue
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(contract, field, value)
        session.add(contract)
        updated += 1

    session.commit()
    return {"updated_contracts": updated}


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
