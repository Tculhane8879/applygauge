from fastapi import APIRouter

from applygauge_api.api.routes.auth import router as auth_router
from applygauge_api.api.routes.health import router as health_router
from applygauge_api.api.routes.job_skills import router as job_skills_router
from applygauge_api.api.routes.jobs import router as jobs_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(jobs_router)
api_router.include_router(job_skills_router)
