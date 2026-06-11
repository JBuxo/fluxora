<p align="center">
  <img src="frontend/public/logo.png" alt="Fluxora" width="80" />
</p>

<h1 align="center">Fluxora</h1>

<p align="center">
  Energy analytics and bill intelligence for Spanish households.
  <br />
  Connect your distributor. Understand your consumption. Cut your bill.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.136-009688?logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-auth%20%2B%20db-3ECF8E?logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Prophet-forecasting-FF6B35" />
</p>

---

## What it does

Fluxora pulls your hourly electricity data from Datadis (Spain's distributor aggregator) and turns it into actionable intelligence:

- **Consumption trends** — daily and monthly kWh and cost over your full history
- **Usage heatmap** — hour × day pattern to see exactly when you're using power
- **Anomaly detection** — statistically flags days where usage is unexpectedly high
- **Bill forecast** — projects end-of-month cost with confidence bands from a per-home Prophet model
- **Smart recommendations** — personalized savings suggestions based on your actual patterns (timing shifts, tariff fit, contracted power, appliance scheduling, weather sensitivity)
- **Distributor reports** — parse and store your official CSV exports alongside live data

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, TailwindCSS 4, shadcn/ui, Recharts |
| Backend | FastAPI, Python, SQLModel (SQLAlchemy 2 + Pydantic 2), Alembic |
| Database | PostgreSQL via Supabase (psycopg3, Transaction Pooler) |
| Auth | Supabase JWT (ES256/HS256), verified server-side |
| Forecasting | Prophet 1.3 with custom regressors (temperature, tariff, usage profile) |
| Data source | Datadis API (Spanish electricity distributor aggregator) |

## Project structure

```
fluxora/
├── frontend/          # Next.js app
│   ├── app/
│   │   ├── (protected)/   # Authenticated routes (dashboard, analytics, reports)
│   │   ├── (onboarding)/  # Setup wizard
│   │   ├── (public)/      # Landing page
│   │   └── api/           # Next.js API routes (proxy to backend)
│   ├── components/        # UI components (shadcn/ui + custom)
│   └── hooks/             # Data fetching hooks
│
└── backend/           # FastAPI app
    └── app/
        ├── core/auth.py       # JWT verification
        ├── db/database.py     # SQLModel engine
        ├── models/            # SQLModel table models
        ├── routes/            # FastAPI routers
        └── services/          # Business logic (forecast, recommendations, analytics)
```

## Local development

### Prerequisites

- Node.js 20+
- Python 3.11+
- A Supabase project
- Datadis account (optional — needed for live data sync)

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env.local`:

```env
DATABASE_URL=postgresql+psycopg://<user>:<password>@<host>:6543/postgres
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_JWT_SECRET=<jwt-secret>
CREDENTIAL_ENCRYPTION_KEY=<fernet-key>
DEVELOPMENT=false
```

Run migrations and start:

```powershell
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```powershell
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

```powershell
npm run dev
```

App runs at `http://localhost:3000`.

### Dev bypass (no magic-link login)

Set in both env files to skip auth and onboarding gates locally:

```env
# backend/.env.local
DEVELOPMENT=true
DEV_USER_ID=<your-supabase-auth-user-uuid>

# frontend/.env.local
NEXT_PUBLIC_DEV_MODE=true
```

## Database migrations

```powershell
# After changing a model
alembic revision --autogenerate -m "describe change"
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Key patterns

**Auth guard in routes:**
```python
payload: dict = Depends(verify_token)  # from app.core.auth
```

**DB session:**
```python
session: Session = Depends(get_session)  # from app.db.database
```

**Adding a model:** create `app/models/<name>.py`, export from `app/models/__init__.py`, Alembic picks it up automatically.

**Adding a route:** create `app/routes/<name>.py` with an `APIRouter`, include it in `app/main.py`.
