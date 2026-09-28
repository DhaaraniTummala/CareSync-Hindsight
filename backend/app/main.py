from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import ai, appointments, auth, doctors, patients, records, uploads

app = FastAPI(title="CareSync AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Every route lives under /api so the same FastAPI app works unchanged
# whether it's run locally with uvicorn or deployed as a single Vercel
# serverless function (api/index.py) sharing one domain with the frontend
# — Vercel forwards the original request path (including /api) straight
# through, so the app's own routes have to include that prefix themselves.
api = APIRouter(prefix="/api")
api.include_router(auth.router)
api.include_router(doctors.router)
api.include_router(patients.router)
api.include_router(records.router)
api.include_router(appointments.router)
api.include_router(uploads.router)
api.include_router(ai.router)


@api.get("/health")
async def health():
    return {"status": "ok", "env": settings.env}


app.include_router(api)

# Unprefixed alias kept only for a quick local "is it up" check
# (curl http://localhost:8000/health) — not used by the frontend.
@app.get("/health")
async def health_root():
    return {"status": "ok", "env": settings.env}
