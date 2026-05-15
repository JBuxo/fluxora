# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fluxora is a FastAPI + Supabase application. Backend uses SQLModel (SQLAlchemy + Pydantic) for ORM with Alembic for code-first migrations. Auth delegates to Supabase JWTs verified server-side.

## Backend Commands

All commands run from `backend/` with the venv active (`.\venv\Scripts\activate`).

```powershell
# Run dev server
uvicorn app.main:app --reload

# Generate migration after model changes
alembic revision --autogenerate -m "describe change"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

## Architecture

```
backend/
  app/
    main.py          # FastAPI app, CORS, route registration
    core/auth.py     # Supabase JWT verification (PyJWT, HS256, audience="authenticated")
    db/database.py   # SQLModel engine + get_session() dependency
    models/          # SQLModel table= models; imported in alembic/env.py for autogenerate
    routes/          # (empty) FastAPI routers go here
  alembic/
    env.py           # Loads .env, overrides sqlalchemy.url from DATABASE_URL
    versions/        # Generated migration scripts
  .env               # DATABASE_URL, SUPABASE_URL, SUPABASE_JWT_SECRET
```

## Key Patterns

**Adding a model**: Create `app/models/<name>.py` with `class Foo(SQLModel, table=True)`, export from `app/models/__init__.py`. Alembic picks it up via the wildcard import in `env.py`.

**Adding a route**: Create `app/routes/<name>.py` with an `APIRouter`, then include it in `app/main.py` via `app.include_router(...)`.

**DB session in routes**: Use `session: Session = Depends(get_session)` from `app.db.database`.

**Auth guard**: Use `payload: dict = Depends(verify_token)` from `app.core.auth`. Token is the Supabase JWT passed as `Authorization: Bearer <token>`.

## Database

- Driver: `psycopg` (psycopg3) via `postgresql+psycopg://`
- Supabase connection string: use **Transaction Pooler** URL from Supabase Dashboard → Settings → Database, not the direct connection.
- `User.id` is a `uuid.UUID` — intended to mirror Supabase `auth.users.id` for the app-level profile row.
- Never commit `*.db` files or `.env`.
