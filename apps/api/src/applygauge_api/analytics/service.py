from decimal import ROUND_HALF_UP, Decimal
from uuid import UUID

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from applygauge_api.analytics.schemas import (
    AnalyticsOverviewRead,
    RecentJobRead,
    SkillDemandRead,
    SkillInsightsResponse,
)
from applygauge_api.jobs.models import Company, Job
from applygauge_api.jobs.statuses import ApplicationStatus
from applygauge_api.skills.models import JobSkill, Skill
from applygauge_api.skills.schemas import SkillCategory

APPLIED_STATUSES = (
    ApplicationStatus.APPLIED,
    ApplicationStatus.SCREENING,
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.OFFER,
    ApplicationStatus.REJECTED,
)
RESPONDED_STATUSES = (
    ApplicationStatus.SCREENING,
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.OFFER,
    ApplicationStatus.REJECTED,
)
PERCENTAGE_QUANTUM = Decimal("0.1")


def percentage(numerator: int, denominator: int) -> float:
    """Return a one-decimal percentage using deterministic half-up rounding."""
    value = (Decimal(numerator) * Decimal(100) / Decimal(denominator)).quantize(
        PERCENTAGE_QUANTUM,
        rounding=ROUND_HALF_UP,
    )
    return float(value)


def _total_jobs(session: Session, user_id: UUID) -> int:
    return session.scalar(select(func.count(Job.id)).where(Job.user_id == user_id)) or 0


def _skill_demand(
    session: Session, user_id: UUID, total_jobs: int, *, limit: int | None = None
) -> list[SkillDemandRead]:
    job_count = func.count(JobSkill.job_id).label("job_count")
    statement = (
        select(Skill.id, Skill.name, Skill.category, job_count)
        .select_from(Job)
        .join(JobSkill, JobSkill.job_id == Job.id)
        .join(Skill, Skill.id == JobSkill.skill_id)
        .where(Job.user_id == user_id)
        .group_by(Skill.id, Skill.name, Skill.category)
        .order_by(job_count.desc(), Skill.name.asc(), Skill.id.asc())
    )
    if limit is not None:
        statement = statement.limit(limit)

    return [
        SkillDemandRead(
            id=row.id,
            name=row.name,
            category=SkillCategory(row.category),
            job_count=row.job_count,
            job_percentage=percentage(row.job_count, total_jobs),
        )
        for row in session.execute(statement)
    ]


def get_overview(session: Session, user_id: UUID) -> AnalyticsOverviewRead:
    applied_case = case((Job.current_status.in_(APPLIED_STATUSES), 1), else_=0)
    interview_case = case((Job.current_status == ApplicationStatus.INTERVIEW, 1), else_=0)
    responded_case = case((Job.current_status.in_(RESPONDED_STATUSES), 1), else_=0)
    summary = session.execute(
        select(
            func.count(Job.id),
            func.sum(applied_case),
            func.sum(interview_case),
            func.sum(responded_case),
        ).where(Job.user_id == user_id)
    ).one()
    total_jobs = summary[0]
    applied_jobs = summary[1] or 0
    interview_jobs = summary[2] or 0
    responded_jobs = summary[3] or 0

    recent_rows = session.execute(
        select(Job.id, Company.name, Job.title, Job.current_status, Job.created_at)
        .join(Company, Company.id == Job.company_id)
        .where(Job.user_id == user_id)
        .order_by(Job.created_at.desc(), Job.id.desc())
        .limit(5)
    )
    recent_jobs = [
        RecentJobRead(
            id=row.id,
            company_name=row.name,
            title=row.title,
            current_status=ApplicationStatus(row.current_status),
            created_at=row.created_at,
        )
        for row in recent_rows
    ]

    return AnalyticsOverviewRead(
        total_jobs=total_jobs,
        applied_jobs=applied_jobs,
        interview_jobs=interview_jobs,
        response_rate_percentage=(
            percentage(responded_jobs, applied_jobs) if applied_jobs else None
        ),
        top_skills=_skill_demand(session, user_id, total_jobs, limit=5),
        recent_jobs=recent_jobs,
    )


def get_skill_insights(session: Session, user_id: UUID) -> SkillInsightsResponse:
    total_jobs = _total_jobs(session, user_id)
    return SkillInsightsResponse(
        total_jobs=total_jobs,
        items=_skill_demand(session, user_id, total_jobs),
    )
