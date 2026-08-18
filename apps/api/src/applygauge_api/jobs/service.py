from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from applygauge_api.auth.models import AuthenticatedUser
from applygauge_api.jobs.models import Company, Job, StatusEvent
from applygauge_api.jobs.normalization import normalize_company_name
from applygauge_api.jobs.schemas import JobCreate, JobUpdate, StatusUpdate
from applygauge_api.jobs.statuses import ApplicationStatus


class JobNotFoundError(Exception):
    """Raised when an owned job does not exist."""


class StatusNoOpError(Exception):
    """Raised when a requested status equals the current status."""


def _find_company(session: Session, user_id: UUID, normalized_name: str) -> Company | None:
    return session.scalar(
        select(Company).where(
            Company.user_id == user_id,
            Company.normalized_name == normalized_name,
        )
    )


def _resolve_company(session: Session, user_id: UUID, display_name: str) -> Company:
    normalized_name = normalize_company_name(display_name)
    existing = _find_company(session, user_id, normalized_name)
    if existing is not None:
        return existing

    company = Company(
        user_id=user_id,
        name=display_name,
        normalized_name=normalized_name,
    )
    try:
        with session.begin_nested():
            session.add(company)
            session.flush()
    except IntegrityError:
        winner = _find_company(session, user_id, normalized_name)
        if winner is None:
            raise
        return winner
    return company


def create_job(session: Session, current_user: AuthenticatedUser, payload: JobCreate) -> Job:
    try:
        company = _resolve_company(session, current_user.id, payload.company_name)
        job = Job(
            user_id=current_user.id,
            company=company,
            title=payload.title,
            job_url=str(payload.job_url) if payload.job_url is not None else None,
            location=payload.location,
            work_arrangement=payload.work_arrangement.value,
            employment_type=payload.employment_type.value,
            description=payload.description,
            current_status=ApplicationStatus.SAVED.value,
        )
        session.add(job)
        session.flush()
        session.add(
            StatusEvent(
                user_id=current_user.id,
                job_id=job.id,
                from_status=None,
                to_status=ApplicationStatus.SAVED.value,
                changed_at=job.created_at,
            )
        )
        session.flush()
        session.commit()
        return job
    except Exception:
        session.rollback()
        raise


def list_owned_jobs(session: Session, user_id: UUID) -> list[Job]:
    return list(
        session.scalars(
            select(Job)
            .options(joinedload(Job.company))
            .where(Job.user_id == user_id)
            .order_by(Job.created_at.desc(), Job.id.desc())
        ).all()
    )


def get_owned_job(session: Session, user_id: UUID, job_id: UUID) -> Job:
    job = session.scalar(
        select(Job).options(joinedload(Job.company)).where(Job.id == job_id, Job.user_id == user_id)
    )
    if job is None:
        raise JobNotFoundError
    return job


def transition_job_status(
    session: Session,
    current_user: AuthenticatedUser,
    job_id: UUID,
    payload: StatusUpdate,
) -> Job:
    try:
        job = session.scalar(
            select(Job)
            .options(joinedload(Job.company))
            .where(Job.id == job_id, Job.user_id == current_user.id)
            .with_for_update(of=Job)
        )
        if job is None:
            raise JobNotFoundError
        if job.current_status == payload.status.value:
            raise StatusNoOpError

        previous_status = job.current_status
        job.current_status = payload.status.value
        session.add(
            StatusEvent(
                user_id=current_user.id,
                job_id=job.id,
                from_status=previous_status,
                to_status=payload.status.value,
            )
        )
        session.flush()
        session.commit()
        return job
    except (JobNotFoundError, StatusNoOpError):
        session.rollback()
        raise
    except Exception:
        session.rollback()
        raise


def list_status_events(session: Session, user_id: UUID, job_id: UUID) -> list[StatusEvent]:
    owned_job_id = session.scalar(select(Job.id).where(Job.id == job_id, Job.user_id == user_id))
    if owned_job_id is None:
        raise JobNotFoundError
    return list(
        session.scalars(
            select(StatusEvent)
            .where(StatusEvent.user_id == user_id, StatusEvent.job_id == job_id)
            .order_by(StatusEvent.changed_at.asc(), StatusEvent.id.asc())
        ).all()
    )


def update_job(
    session: Session,
    current_user: AuthenticatedUser,
    job_id: UUID,
    payload: JobUpdate,
) -> Job:
    try:
        job = get_owned_job(session, current_user.id, job_id)
        supplied_fields = payload.model_fields_set

        if "company_name" in supplied_fields:
            assert payload.company_name is not None
            job.company = _resolve_company(session, current_user.id, payload.company_name)
        if "title" in supplied_fields:
            assert payload.title is not None
            job.title = payload.title
        if "description" in supplied_fields:
            job.description = payload.description
        if "job_url" in supplied_fields:
            job.job_url = str(payload.job_url) if payload.job_url is not None else None
        if "location" in supplied_fields:
            job.location = payload.location
        if "work_arrangement" in supplied_fields:
            assert payload.work_arrangement is not None
            job.work_arrangement = payload.work_arrangement.value
        if "employment_type" in supplied_fields:
            assert payload.employment_type is not None
            job.employment_type = payload.employment_type.value

        session.flush()
        session.commit()
        return job
    except JobNotFoundError:
        raise
    except Exception:
        session.rollback()
        raise


def delete_job(session: Session, user_id: UUID, job_id: UUID) -> None:
    try:
        job = get_owned_job(session, user_id, job_id)
        session.delete(job)
        session.commit()
    except JobNotFoundError:
        raise
    except Exception:
        session.rollback()
        raise
