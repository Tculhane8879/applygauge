from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from applygauge_api.jobs.statuses import ApplicationStatus
from applygauge_api.skills.schemas import SkillCategory


class SkillDemandRead(BaseModel):
    id: UUID
    name: str
    category: SkillCategory
    job_count: int
    job_percentage: float


class RecentJobRead(BaseModel):
    id: UUID
    company_name: str
    title: str
    current_status: ApplicationStatus
    created_at: datetime


class AnalyticsOverviewRead(BaseModel):
    total_jobs: int
    applied_jobs: int
    interview_jobs: int
    response_rate_percentage: float | None
    top_skills: list[SkillDemandRead]
    recent_jobs: list[RecentJobRead]


class SkillInsightsResponse(BaseModel):
    total_jobs: int
    items: list[SkillDemandRead]
