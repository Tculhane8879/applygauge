from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.orm import Session, joinedload

from applygauge_api.jobs.models import Job
from applygauge_api.jobs.service import JobNotFoundError
from applygauge_api.skills.extraction import ExtractionTerm, extract_skill_ids
from applygauge_api.skills.models import JobSkill, JobSkillSuppression, Skill, SkillTerm
from applygauge_api.skills.normalization import normalize_skill_term
from applygauge_api.skills.schemas import SkillAdd


class SkillNotAvailableError(Exception):
    """Raised when a submitted term is not present in the curated catalog."""


@dataclass(frozen=True)
class AddJobSkillResult:
    association: JobSkill
    created: bool


def require_owned_job_locked(session: Session, user_id: UUID, job_id: UUID) -> Job:
    """Authorize and lock the job that serializes every job-skill mutation."""
    job = session.scalar(
        select(Job).where(Job.id == job_id, Job.user_id == user_id).with_for_update(of=Job)
    )
    if job is None:
        raise JobNotFoundError
    return job


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


def list_job_skills(session: Session, user_id: UUID, job_id: UUID) -> list[JobSkill]:
    owned_job_id = session.scalar(select(Job.id).where(Job.id == job_id, Job.user_id == user_id))
    if owned_job_id is None:
        raise JobNotFoundError
    return list(
        session.scalars(
            select(JobSkill)
            .options(joinedload(JobSkill.skill))
            .join(Skill, JobSkill.skill_id == Skill.id)
            .where(JobSkill.job_id == job_id, JobSkill.user_id == user_id)
            .order_by(Skill.name.asc(), Skill.id.asc())
        ).all()
    )


def load_extraction_terms(session: Session) -> list[ExtractionTerm]:
    rows = session.execute(
        select(SkillTerm.skill_id, SkillTerm.normalized_term)
        .where(SkillTerm.is_extractable.is_(True))
        .order_by(SkillTerm.normalized_term, SkillTerm.skill_id)
    ).all()
    return [
        ExtractionTerm(skill_id=row.skill_id, normalized_term=row.normalized_term) for row in rows
    ]


def reconcile_detected_skills(
    session: Session, owned_locked_job: Job, description: str | None
) -> None:
    """Reconcile detected provenance; caller owns the new or SELECT-FOR-UPDATE job row."""
    matched = set(extract_skill_ids(description, load_extraction_terms(session)))
    suppressed = set(
        session.scalars(
            select(JobSkillSuppression.skill_id).where(
                JobSkillSuppression.job_id == owned_locked_job.id,
                JobSkillSuppression.user_id == owned_locked_job.user_id,
            )
        ).all()
    )
    effective = matched - suppressed
    existing = {
        association.skill_id: association
        for association in session.scalars(
            select(JobSkill).where(
                JobSkill.job_id == owned_locked_job.id,
                JobSkill.user_id == owned_locked_job.user_id,
            )
        ).all()
    }

    for skill_id in effective:
        association = existing.get(skill_id)
        if association is None:
            session.add(
                JobSkill(
                    job_id=owned_locked_job.id,
                    skill_id=skill_id,
                    user_id=owned_locked_job.user_id,
                    is_manual=False,
                    is_detected=True,
                )
            )
        elif not association.is_detected:
            association.is_detected = True

    for skill_id, association in existing.items():
        if skill_id in effective or not association.is_detected:
            continue
        if association.is_manual:
            association.is_detected = False
        else:
            session.delete(association)
    session.flush()


def add_job_skill(
    session: Session,
    user_id: UUID,
    job_id: UUID,
    payload: SkillAdd,
) -> AddJobSkillResult:
    try:
        require_owned_job_locked(session, user_id, job_id)
        skill = resolve_skill_term(session, payload.name)
        session.execute(
            delete(JobSkillSuppression).where(
                JobSkillSuppression.job_id == job_id,
                JobSkillSuppression.user_id == user_id,
                JobSkillSuppression.skill_id == skill.id,
            )
        )
        association = session.scalar(
            select(JobSkill)
            .options(joinedload(JobSkill.skill))
            .where(
                JobSkill.job_id == job_id,
                JobSkill.user_id == user_id,
                JobSkill.skill_id == skill.id,
            )
        )
        created = association is None
        if association is None:
            association = JobSkill(
                job_id=job_id, skill_id=skill.id, user_id=user_id, is_manual=True, is_detected=False
            )
            association.skill = skill
            session.add(association)
        else:
            association.is_manual = True
        session.flush()
        session.commit()
        return AddJobSkillResult(association=association, created=created)
    except (JobNotFoundError, SkillNotAvailableError):
        session.rollback()
        raise
    except Exception:
        session.rollback()
        raise


def remove_job_skill(session: Session, user_id: UUID, job_id: UUID, skill_id: UUID) -> None:
    try:
        require_owned_job_locked(session, user_id, job_id)
        association = session.scalar(
            select(JobSkill).where(
                JobSkill.job_id == job_id,
                JobSkill.user_id == user_id,
                JobSkill.skill_id == skill_id,
            )
        )
        if association is not None:
            was_detected = association.is_detected
            session.delete(association)
            if was_detected:
                session.execute(
                    postgresql_insert(JobSkillSuppression)
                    .values(job_id=job_id, skill_id=skill_id, user_id=user_id)
                    .on_conflict_do_nothing(
                        index_elements=[JobSkillSuppression.job_id, JobSkillSuppression.skill_id]
                    )
                )
        session.flush()
        session.commit()
    except JobNotFoundError:
        session.rollback()
        raise
    except Exception:
        session.rollback()
        raise
