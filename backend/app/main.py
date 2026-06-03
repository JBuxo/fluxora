from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import analytics, anomalies, datadis, forecast, homes, recommendations, report, supply_points, users, usage_profiles

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(datadis.router)
app.include_router(homes.router)
app.include_router(supply_points.router)
app.include_router(analytics.router)
app.include_router(report.router)
app.include_router(usage_profiles.router)
app.include_router(forecast.router)
app.include_router(anomalies.router)
app.include_router(recommendations.router)


@app.get("/health")
async def health():
    return {"status": "200 OK"}
