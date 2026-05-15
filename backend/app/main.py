from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import homes, supply_points, users

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(homes.router)
app.include_router(supply_points.router)


@app.get("/health")
async def health():
    return {"status": "200 OK"}
