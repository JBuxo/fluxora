import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session, select

from app.db.database import get_session
from app.models import Home
from app.services.forecast import run_forecast
from app.services.weather import assign_weather_location, sync_weather

router = APIRouter(prefix="/internal", tags=["internal"])


def _require_cron_secret(x_cron_secret: str = Header(...)) -> None:
    expected = os.getenv("CRON_SECRET", "")
    if not expected or x_cron_secret != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("/forecast-refresh")
def forecast_refresh_all(
    session: Session = Depends(get_session),
    _: None = Depends(_require_cron_secret),
):
    """Refresh weather + Prophet forecast for every home. Called by Vercel cron."""
    homes = session.exec(select(Home)).all()
    started_at = datetime.now(timezone.utc)
    results: list[dict] = []

    for home in homes:
        result: dict = {"home_id": str(home.id), "status": "ok", "error": None}
        try:
            if not home.weather_location_id:
                loc = assign_weather_location(home.id, session)
                session.commit()
                if loc:
                    sync_weather(loc.id, session)
            else:
                sync_weather(home.weather_location_id, session)

            run_forecast(home.id, session)
        except Exception as e:
            result["status"] = "error"
            result["error"] = str(e)

        results.append(result)

    ok = sum(1 for r in results if r["status"] == "ok")
    errors = sum(1 for r in results if r["status"] == "error")

    return {
        "started_at": started_at.isoformat(),
        "finished_at": datetime.now(timezone.utc).isoformat(),
        "total_homes": len(homes),
        "ok": ok,
        "errors": errors,
        "detail": results,
    }
