from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.orm import Session

from applygauge_api.jobs.models import Job
from applygauge_api.jobs.service import JobNotFoundError
from applygauge_api.skills.models import JobSkill, Skill, SkillTerm
from applygauge_api.skills.normalization import normalize_skill_term
from applygauge_api.skills.schemas import SkillAdd


class SkillNotAvailableError(Exception):
    """Raised when a submitted term is not present in the curated catalog."""


@dataclass(frozen=True)
class AddJobSkillResult:
    skill: Skill
    created: bool


def _require_owned_job(session: Session, user_id: UUID, job_id: UUID) -> None:
    owned_job_id = session.scalar(select(Job.id).where(Job.id == job_id, Job.user_id == user_id))
    if owned_job_id is None:
        raise JobNotFoundError


def resolve_skill_term(session: Session, submitted_name: str) -> Skill:
    normalized_term = normalize_skill_term(submitted_name)
    skill = session.scalar(
        select(Skill)
        .join(SkillTerm, SkillTerm.skill_id == Skill.id)
        .where(SkillTerm.normalized_term == normalized_term)
    )
    if skill is None:
        raise SkillNotAvailableError
    return skill


def list_job_skills(session: Session, user_id: UUID, job_id: UUID) -> list[Skill]:
    _require_owned_job(session, user_id, job_id)
    return list(
        session.scalars(
            select(Skill)
            .join(JobSkill, JobSkill.skill_id == Skill.id)
            .where(JobSkill.job_id == job_id, JobSkill.user_id == user_id)
            .order_by(Skill.name.asc(), Skill.id.asc())
        ).all()
    )


def add_job_skill(
    session: Session,
    user_id: UUID,
    job_id: UUID,
    payload: SkillAdd,
) -> AddJobSkillResult:
    try:
        _require_owned_job(session, user_id, job_id)
        skill = resolve_skill_term(session, payload.name)
        inserted_skill_id = session.scalar(
            postgresql_insert(JobSkill)
            .values(job_id=job_id, skill_id=skill.id, user_id=user_id)
            .on_conflict_do_nothing(index_elements=[JobSkill.job_id, JobSkill.skill_id])
            .returning(JobSkill.skill_id)
        )
        session.commit()
        return AddJobSkillResult(skill=skill, created=inserted_skill_id is not None)
    except (JobNotFoundError, SkillNotAvailableError):
        session.rollback()
        raise
    except Exception:
        session.rollback()
        raise


def remove_job_skill(session: Session, user_id: UUID, job_id: UUID, skill_id: UUID) -> None:
    try:
        _require_owned_job(session, user_id, job_id)
        session.execute(
            delete(JobSkill).where(
                JobSkill.job_id == job_id,
                JobSkill.user_id == user_id,
                JobSkill.skill_id == skill_id,
            )
        )
        session.commit()
    except JobNotFoundError:
        session.rollback()
        raise
    except Exception:
        session.rollback()
        raise
