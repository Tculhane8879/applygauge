from collections.abc import Callable
from uuid import UUID, uuid4

import pytest
from sqlalchemy import delete, insert, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from applygauge_api.jobs.models import Company, Job, StatusEvent
from applygauge_api.jobs.normalization import normalize_company_name
from applygauge_api.jobs.statuses import ApplicationStatus

pytestmark = pytest.mark.integration


def add_company(session: Session, user_id: UUID, name: str = "Acme") -> Company:
    company = Company(
        user_id=user_id,
        name=name,
        normalized_name=normalize_company_name(name),
    )
    session.add(company)
    session.flush()
    return company


def add_job(
    session: Session,
    company: Company,
    user_id: UUID,
    **overrides: str | None,
) -> Job:
    values: dict[str, str | None] = {
        "title": "Software Engineer",
        "job_url": None,
        "location": None,
        "description": None,
        "work_arrangement": "UNKNOWN",
        "employment_type": "UNKNOWN",
        "current_status": "SAVED",
    }
    values.update(overrides)
    job = Job(company_id=company.id, user_id=user_id, **values)
    session.add(job)
    session.flush()
    return job


def expect_integrity_error(session: Session, operation: Callable[[], object]) -> None:
    with pytest.raises(IntegrityError), session.begin_nested():
        operation()
        session.flush()


def test_company_normalized_name_is_unique_per_user(database_session: Session) -> None:
    user_id = uuid4()
    add_company(database_session, user_id, "Acme")

    expect_integrity_error(
        database_session,
        lambda: database_session.add(
            Company(user_id=user_id, name=" ACME ", normalized_name="acme")
        ),
    )


def test_same_normalized_company_name_is_allowed_for_different_users(
    database_session: Session,
) -> None:
    first = add_company(database_session, uuid4(), "Acme")
    second = add_company(database_session, uuid4(), " ACME ")

    assert first.normalized_name == second.normalized_name == "acme"


def test_same_owner_company_job_relationship_succeeds(database_session: Session) -> None:
    user_id = uuid4()
    company = add_company(database_session, user_id)

    job = add_job(database_session, company, user_id)

    assert job.id is not None
    assert job.company_id == company.id


def test_cross_owner_company_job_relationship_is_rejected(database_session: Session) -> None:
    company = add_company(database_session, uuid4())

    expect_integrity_error(
        database_session,
        lambda: database_session.add(
            Job(
                user_id=uuid4(),
                company_id=company.id,
                title="Software Engineer",
                current_status="SAVED",
            )
        ),
    )


@pytest.mark.parametrize(
    ("field", "value"),
    [("work_arrangement", "ANYWHERE"), ("employment_type", "PERMANENT")],
)
def test_invalid_constrained_job_value_is_rejected(
    database_session: Session, field: str, value: str
) -> None:
    user_id = uuid4()
    company = add_company(database_session, user_id)

    expect_integrity_error(
        database_session,
        lambda: database_session.execute(
            insert(Job).values(
                id=uuid4(),
                user_id=user_id,
                company_id=company.id,
                title="Software Engineer",
                current_status="SAVED",
                **{field: value},
            )
        ),
    )


def test_optional_job_fields_are_nullable(database_session: Session) -> None:
    user_id = uuid4()
    company = add_company(database_session, user_id)

    job = add_job(
        database_session,
        company,
        user_id,
        job_url=None,
        location=None,
        description=None,
    )

    assert job.job_url is None
    assert job.location is None
    assert job.description is None


@pytest.mark.parametrize("missing_field", ["title", "company_id"])
def test_required_job_fields_are_enforced(database_session: Session, missing_field: str) -> None:
    user_id = uuid4()
    company = add_company(database_session, user_id)
    values = {
        "id": uuid4(),
        "user_id": user_id,
        "company_id": company.id,
        "title": "Software Engineer",
        "current_status": "SAVED",
    }
    values[missing_field] = None

    expect_integrity_error(
        database_session,
        lambda: database_session.execute(insert(Job).values(**values)),
    )


def test_unknown_company_foreign_key_is_rejected(database_session: Session) -> None:
    expect_integrity_error(
        database_session,
        lambda: database_session.add(
            Job(
                user_id=uuid4(),
                company_id=uuid4(),
                title="Software Engineer",
                current_status="SAVED",
            )
        ),
    )


@pytest.mark.parametrize("status", list(ApplicationStatus))
def test_each_application_status_is_accepted(database_session: Session, status: str) -> None:
    user_id = uuid4()
    company = add_company(database_session, user_id)
    assert (
        add_job(database_session, company, user_id, current_status=status).current_status == status
    )


@pytest.mark.parametrize("status", ["UNKNOWN", None])
def test_invalid_or_null_current_status_is_rejected(
    database_session: Session, status: str | None
) -> None:
    user_id = uuid4()
    company = add_company(database_session, user_id)
    expect_integrity_error(
        database_session,
        lambda: database_session.execute(
            insert(Job).values(
                id=uuid4(),
                user_id=user_id,
                company_id=company.id,
                title="Engineer",
                current_status=status,
            )
        ),
    )


def test_status_event_constraints_and_generated_values(database_session: Session) -> None:
    user_id = uuid4()
    company = add_company(database_session, user_id)
    job = add_job(database_session, company, user_id)
    initial = StatusEvent(user_id=user_id, job_id=job.id, from_status=None, to_status="SAVED")
    transition = StatusEvent(
        user_id=user_id, job_id=job.id, from_status="SAVED", to_status="APPLIED"
    )
    database_session.add_all([initial, transition])
    database_session.flush()
    assert initial.id is not None and initial.changed_at is not None


@pytest.mark.parametrize(
    ("from_status", "to_status"),
    [("INVALID", "SAVED"), (None, "INVALID"), ("SAVED", "SAVED")],
)
def test_invalid_status_event_is_rejected(
    database_session: Session, from_status: str | None, to_status: str
) -> None:
    user_id = uuid4()
    company = add_company(database_session, user_id)
    job = add_job(database_session, company, user_id)
    expect_integrity_error(
        database_session,
        lambda: database_session.add(
            StatusEvent(
                user_id=user_id, job_id=job.id, from_status=from_status, to_status=to_status
            )
        ),
    )


def test_status_event_ownership_is_enforced(database_session: Session) -> None:
    owner_id, other_id = uuid4(), uuid4()
    company = add_company(database_session, owner_id)
    job = add_job(database_session, company, owner_id)
    expect_integrity_error(
        database_session,
        lambda: database_session.add(
            StatusEvent(user_id=other_id, job_id=job.id, from_status=None, to_status="SAVED")
        ),
    )
    expect_integrity_error(
        database_session,
        lambda: database_session.add(
            StatusEvent(user_id=owner_id, job_id=uuid4(), from_status=None, to_status="SAVED")
        ),
    )


def test_deleting_job_cascades_events_but_preserves_company(database_session: Session) -> None:
    user_id = uuid4()
    company = add_company(database_session, user_id)
    job = add_job(database_session, company, user_id)
    database_session.add(
        StatusEvent(user_id=user_id, job_id=job.id, from_status=None, to_status="SAVED")
    )
    database_session.flush()
    database_session.execute(delete(Job).where(Job.id == job.id))
    database_session.flush()
    assert database_session.scalar(select(StatusEvent).where(StatusEvent.job_id == job.id)) is None
    assert database_session.get(Company, company.id) is not None
