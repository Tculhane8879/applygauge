from collections.abc import Callable
from uuid import UUID, uuid4

import pytest
from sqlalchemy import insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from applygauge_api.jobs.models import Company, Job
from applygauge_api.jobs.normalization import normalize_company_name

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
            Job(user_id=uuid4(), company_id=company.id, title="Software Engineer")
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
            Job(user_id=uuid4(), company_id=uuid4(), title="Software Engineer")
        ),
    )
