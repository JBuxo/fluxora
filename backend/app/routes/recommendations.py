import json
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.core.deps import current_user
from app.db.database import get_session
from app.models import Home
from app.models.recommendation_feedback import RecommendationFeedback
from app.services.recommendations import Recommendation, generate_recommendations

router = APIRouter(prefix="/homes", tags=["recommendations"])


class RecommendationOut(BaseModel):
    id: str
    type: str
    title: str
    detail: str
    potential_saving_eur: float
    confidence: str
    supporting_data: dict[str, Any]


class RecommendationsResponse(BaseModel):
    recommendations: list[RecommendationOut]
    total_potential_saving_eur: float
    generated_at: datetime


class FeedbackIn(BaseModel):
    recommendation_id: str
    recommendation_type: str
    action: str  # "accepted" | "dismissed" | "already_doing" | "not_useful"
    context: Optional[dict[str, Any]] = None


_VALID_ACTIONS = {"accepted", "dismissed", "already_doing", "not_useful"}


@router.get("/{home_id}/recommendations", response_model=RecommendationsResponse)
def get_recommendations(
    home_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    home = session.get(Home, home_id)
    if not home or home.user_id != user_id:
        raise HTTPException(status_code=404, detail="Home not found")

    recs: list[Recommendation] = generate_recommendations(
        session=session,
        home_id=home_id,
        weather_location_id=home.weather_location_id,
    )

    out = [
        RecommendationOut(
            id=r.id,
            type=r.type,
            title=r.title,
            detail=r.detail,
            potential_saving_eur=r.potential_saving_eur,
            confidence=r.confidence,
            supporting_data=r.supporting_data,
        )
        for r in recs
    ]

    total_saving = sum(r.potential_saving_eur for r in recs)

    return RecommendationsResponse(
        recommendations=out,
        total_potential_saving_eur=round(total_saving, 2),
        generated_at=datetime.now(timezone.utc),
    )


@router.post("/{home_id}/recommendations/feedback", status_code=204)
def post_feedback(
    home_id: uuid.UUID,
    body: FeedbackIn,
    user_id: uuid.UUID = Depends(current_user),
    session: Session = Depends(get_session),
):
    home = session.get(Home, home_id)
    if not home or home.user_id != user_id:
        raise HTTPException(status_code=404, detail="Home not found")

    if body.action not in _VALID_ACTIONS:
        raise HTTPException(status_code=422, detail=f"Invalid action. Must be one of: {_VALID_ACTIONS}")

    fb = RecommendationFeedback(
        home_id=home_id,
        recommendation_id=body.recommendation_id,
        recommendation_type=body.recommendation_type,
        action=body.action,
        context_json=json.dumps(body.context) if body.context else None,
    )
    session.add(fb)
    session.commit()
