import uuid
from datetime import date, datetime, timedelta, timezone

import pandas as pd
import requests
from sqlmodel import Session, select

from app.models.home import Home
from app.models.weather_location import WeatherLocation
from app.models.weather_record import WeatherRecord

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
DAILY_VARS = "temperature_2m_max,temperature_2m_min"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

# Grid resolution: round to nearest 0.5° (~50 km) so nearby homes share a location
GRID = 0.5


def _round_to_grid(value: float) -> float:
    return round(round(value / GRID) * GRID, 6)


def _geocode(address: str) -> tuple[float, float] | None:
    """Try address verbatim, then progressively simpler fallbacks (postal code + city)."""
    import re

    candidates = [address]

    # Extract Spanish postal code (5 digits) + city hint
    postal_match = re.search(r"\b(\d{5})\b", address)
    if postal_match:
        postal = postal_match.group(1)
        # Take the last meaningful chunk after the postal code as city
        after = address[postal_match.end():].strip(" -,")
        city = after.split("-")[-1].strip().split(",")[0].strip() if after else ""
        if city:
            candidates.append(f"{postal} {city}, Spain")
        candidates.append(f"{postal}, Spain")

    for q in candidates:
        try:
            resp = requests.get(
                NOMINATIM_URL,
                params={"q": q, "format": "json", "limit": 1},
                headers={"User-Agent": "fluxora-energy-app/1.0"},
                timeout=10,
            )
            resp.raise_for_status()
            results = resp.json()
            if results:
                return float(results[0]["lat"]), float(results[0]["lon"])
        except Exception:
            continue

    return None


def get_or_create_location(
    lat: float, lon: float, label: str | None, session: Session
) -> WeatherLocation:
    """Find or create a WeatherLocation snapped to the 0.5° grid."""
    grid_lat = _round_to_grid(lat)
    grid_lon = _round_to_grid(lon)

    loc = session.exec(
        select(WeatherLocation).where(
            WeatherLocation.latitude == grid_lat,
            WeatherLocation.longitude == grid_lon,
        )
    ).first()

    if not loc:
        loc = WeatherLocation(latitude=grid_lat, longitude=grid_lon, label=label)
        session.add(loc)
        session.flush()

    return loc


def assign_weather_location(home_id: uuid.UUID, session: Session) -> WeatherLocation | None:
    """
    Geocode a home's address, snap to grid, assign weather_location_id.
    Returns the location, or None if geocoding fails.
    """
    home = session.get(Home, home_id)
    if not home or not home.address:
        return None

    coords = _geocode(home.address)
    if not coords:
        return None

    lat, lon = coords
    loc = get_or_create_location(lat, lon, label=home.address.split(",")[-1].strip(), session=session)

    home.weather_location_id = loc.id
    session.add(home)
    session.flush()

    return loc


def sync_weather(location_id: uuid.UUID, session: Session) -> int:
    """
    Fetch Open-Meteo archive + 16-day forecast for a WeatherLocation.
    Fills the 30-day forward window with climatological means for days past the forecast horizon.
    """
    loc = session.get(WeatherLocation, location_id)
    if not loc:
        return 0

    lat, lon = loc.latitude, loc.longitude
    today = date.today()
    forecast_end = today + timedelta(days=30)

    existing = {
        r.record_date: r
        for r in session.exec(
            select(WeatherRecord).where(WeatherRecord.location_id == location_id)
        ).all()
    }

    hist_start = today.replace(year=today.year - 2)
    hist_end = today - timedelta(days=1)

    hist_data: dict[date, tuple[float, float]] = {}
    try:
        resp = requests.get(
            ARCHIVE_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "start_date": hist_start.isoformat(),
                "end_date": hist_end.isoformat(),
                "daily": DAILY_VARS,
                "timezone": "UTC",
            },
            timeout=30,
        )
        resp.raise_for_status()
        daily = resp.json().get("daily", {})
        for d_str, tmax, tmin in zip(
            daily.get("time", []),
            daily.get("temperature_2m_max", []),
            daily.get("temperature_2m_min", []),
        ):
            if tmax is not None and tmin is not None:
                hist_data[date.fromisoformat(d_str)] = (float(tmax), float(tmin))
    except Exception:
        pass

    fcast_data: dict[date, tuple[float, float]] = {}
    try:
        resp = requests.get(
            FORECAST_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "daily": DAILY_VARS,
                "forecast_days": 16,
                "timezone": "UTC",
            },
            timeout=30,
        )
        resp.raise_for_status()
        daily = resp.json().get("daily", {})
        for d_str, tmax, tmin in zip(
            daily.get("time", []),
            daily.get("temperature_2m_max", []),
            daily.get("temperature_2m_min", []),
        ):
            if tmax is not None and tmin is not None:
                fcast_data[date.fromisoformat(d_str)] = (float(tmax), float(tmin))
    except Exception:
        pass

    all_data = {**hist_data, **fcast_data}

    # Fill days 17–30 from climatological means (same day-of-year, 2yr history)
    if hist_data:
        hist_df = pd.DataFrame(
            [(d, v[0], v[1]) for d, v in hist_data.items()],
            columns=["date", "tmax", "tmin"],
        )
        hist_df["doy"] = hist_df["date"].apply(lambda d: d.timetuple().tm_yday)
        clim = hist_df.groupby("doy")[["tmax", "tmin"]].mean().to_dict("index")
        d = today
        while d <= forecast_end:
            if d not in all_data:
                doy = d.timetuple().tm_yday
                if doy in clim:
                    all_data[d] = (clim[doy]["tmax"], clim[doy]["tmin"])
            d += timedelta(days=1)

    upserted = 0
    for record_date, (tmax, tmin) in all_data.items():
        mean = round((tmax + tmin) / 2, 2)
        if record_date in existing:
            rec = existing[record_date]
            rec.temp_max_c = round(tmax, 2)
            rec.temp_min_c = round(tmin, 2)
            rec.temp_mean_c = mean
            session.add(rec)
        else:
            session.add(WeatherRecord(
                location_id=location_id,
                record_date=record_date,
                temp_max_c=round(tmax, 2),
                temp_min_c=round(tmin, 2),
                temp_mean_c=mean,
            ))
        upserted += 1

    loc.last_synced_at = datetime.now(timezone.utc)
    session.add(loc)
    session.commit()
    return upserted
