from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime, timedelta
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from applygauge_api.auth.dependencies import get_current_user
from applygauge_api.auth.models import AuthenticatedUser
from applygauge_api.db.session import get_db_session
from applygauge_api.jobs.models import Company, Job, StatusEvent
from applygauge_api.main import app
from applygauge_api.skills.models import JobSkill, JobSkillSuppression, Skill

pytestmark = pytest.mark.integration

USER_A = AuthenticatedUser(
    id=UUID("11111111-1111-4111-8111-111111111111"),
    email="user-a@example.test",
    session_id=UUID("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
)
USER_B = AuthenticatedUser(
    id=UUID("22222222-2222-4222-8222-222222222222"),
    email="user-b@example.test",
    session_id=UUID("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"),
)


@contextmanager
def client_as(session: Session, user: AuthenticatedUser) -> Iterator[TestClient]:
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_db_session] = lambda: session
    try:
        with TestClient(app) as client:
            yield client
    finally:
        app.dependency_overrides.clear()


def add_job(
    session: Session,
    user: AuthenticatedUser,
    *,
    status: str = "SAVED",
    created_at: datetime | None = None,
    title: str = "Engineer",
) -> Job:
    company = Company(
        user_id=user.id,
        name=f"{title} Company",
        normalized_name=f"{user.id}-{title}".lower(),
    )
    session.add(company)
    session.flush()
    job = Job(
        user_id=user.id,
        company_id=company.id,
        title=title,
        current_status=status,
        **({"created_at": created_at} if created_at is not None else {}),
    )
    session.add(job)
    session.flush()
    return job


def skill(session: Session, name: str) -> Skill:
    result = session.scalar(select(Skill).where(Skill.name == name))
    assert result is not None
    return result


def associate(
    session: Session,
    job: Job,
    canonical_skill: Skill,
    *,
    manual: bool,
    detected: bool,
) -> None:
    session.add(
        JobSkill(
            job_id=job.id,
            skill_id=canonical_skill.id,
            user_id=job.user_id,
            is_manual=manual,
            is_detected=detected,
        )
    )
    session.flush()


def test_zero_jobs_and_jobs_without_skills_return_valid_snapshots(
    database_session: Session,
) -> None:
    with client_as(database_session, USER_A) as client:
        empty_overview = client.get("/api/v1/analytics/overview")
        empty_skills = client.get("/api/v1/analytics/skills")
        add_job(database_session, USER_A, status="APPLIED")
        no_skills = client.get("/api/v1/analytics/skills")

    assert empty_overview.json() == {
        "total_jobs": 0,
        "applied_jobs": 0,
        "interview_jobs": 0,
        "response_rate_percentage": None,
        "top_skills": [],
        "recent_jobs": [],
    }
    assert empty_skills.json() == {"total_jobs": 0, "items": []}
    assert no_skills.json() == {"total_jobs": 1, "items": []}


def test_current_status_summary_sets_and_history_is_ignored(database_session: Session) -> None:
    statuses = ["SAVED", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"]
    jobs = [add_job(database_session, USER_A, status=value, title=value) for value in statuses]
    database_session.add(
        StatusEvent(
            user_id=USER_A.id,
            job_id=jobs[0].id,
            from_status="APPLIED",
            to_status="SAVED",
        )
    )
    add_job(database_session, USER_B, status="INTERVIEW", title="Other User")
    database_session.flush()

    with client_as(database_session, USER_A) as client:
        result = client.get("/api/v1/analytics/overview")

    assert result.status_code == 200
    assert result.json()["total_jobs"] == 7
    assert result.json()["applied_jobs"] == 5
    assert result.json()["interview_jobs"] == 1
    assert result.json()["response_rate_percentage"] == 80.0


def test_response_rate_handles_applied_only_and_no_qualifying_status(
    database_session: Session,
) -> None:
    job = add_job(database_session, USER_A, status="APPLIED")
    with client_as(database_session, USER_A) as client:
        assert client.get("/api/v1/analytics/overview").json()["response_rate_percentage"] == 0.0
        job.current_status = "WITHDRAWN"
        database_session.flush()
        assert client.get("/api/v1/analytics/overview").json()["response_rate_percentage"] is None


def test_skill_demand_counts_provenance_once_and_excludes_suppression(
    database_session: Session,
) -> None:
    python = skill(database_session, "Python")
    jobs = [add_job(database_session, USER_A, title=f"Job {index}") for index in range(4)]
    associate(database_session, jobs[0], python, manual=True, detected=False)
    associate(database_session, jobs[1], python, manual=False, detected=True)
    associate(database_session, jobs[2], python, manual=True, detected=True)
    database_session.add(
        JobSkillSuppression(job_id=jobs[3].id, skill_id=python.id, user_id=USER_A.id)
    )
    for index in range(5):
        other = add_job(database_session, USER_B, title=f"Other {index}")
        associate(database_session, other, python, manual=True, detected=False)
    database_session.flush()

    with client_as(database_session, USER_A) as client:
        user_a = client.get("/api/v1/analytics/skills").json()
    with client_as(database_session, USER_B) as client:
        user_b = client.get("/api/v1/analytics/skills").json()

    assert user_a["total_jobs"] == 4
    assert user_a["items"][0]["job_count"] == 3
    assert user_a["items"][0]["job_percentage"] == 75.0
    assert user_b["total_jobs"] == 5
    assert user_b["items"][0]["job_count"] == 5
    assert user_b["items"][0]["job_percentage"] == 100.0


def test_skill_ranking_top_five_and_complete_insights(database_session: Session) -> None:
    names = ["Python", "React", "TypeScript", "PostgreSQL", "Docker", "AWS"]
    skills = [skill(database_session, name) for name in names]
    jobs = [add_job(database_session, USER_A, title=f"Job {index}") for index in range(3)]
    for canonical_skill in skills:
        associate(database_session, jobs[0], canonical_skill, manual=True, detected=False)
    associate(database_session, jobs[1], skills[0], manual=True, detected=False)
    database_session.flush()

    with client_as(database_session, USER_A) as client:
        overview = client.get("/api/v1/analytics/overview").json()
        insights = client.get("/api/v1/analytics/skills").json()

    expected = ["Python", "AWS", "Docker", "PostgreSQL", "React", "TypeScript"]
    assert [item["name"] for item in insights["items"]] == expected
    assert [item["name"] for item in overview["top_skills"]] == expected[:5]
    assert insights["items"][0]["job_percentage"] == 66.7


def test_recent_jobs_use_created_time_id_tie_break_and_owner_scope(
    database_session: Session,
) -> None:
    base = datetime(2026, 1, 1, tzinfo=UTC)
    jobs = [
        add_job(database_session, USER_A, created_at=base + timedelta(days=index), title=str(index))
        for index in range(6)
    ]
    tied = add_job(database_session, USER_A, created_at=base + timedelta(days=5), title="tie")
    add_job(database_session, USER_B, created_at=base + timedelta(days=20), title="foreign")

    with client_as(database_session, USER_A) as client:
        recent = client.get("/api/v1/analytics/overview").json()["recent_jobs"]

    expected_tie = sorted([jobs[5].id, tied.id], reverse=True)
    assert len(recent) == 5
    assert [UUID(item["id"]) for item in recent[:2]] == expected_tie
    assert all(item["title"] != "foreign" for item in recent)
    assert all("created_at" in item and "updated_at" not in item for item in recent)


def test_reads_reflect_skill_status_and_job_mutations(database_session: Session) -> None:
    python = skill(database_session, "Python")
    job = add_job(database_session, USER_A, status="SAVED")
    with client_as(database_session, USER_A) as client:
        initial = client.get("/api/v1/analytics/overview").json()
        job.current_status = "INTERVIEW"
        associate(database_session, job, python, manual=True, detected=False)
        changed = client.get("/api/v1/analytics/overview").json()
        association = database_session.get(JobSkill, (job.id, python.id))
        assert association is not None
        database_session.delete(association)
        database_session.flush()
        skill_removed = client.get("/api/v1/analytics/overview").json()
        database_session.delete(job)
        database_session.flush()
        deleted = client.get("/api/v1/analytics/overview").json()

    assert (initial["applied_jobs"], initial["top_skills"]) == (0, [])
    assert changed["applied_jobs"] == changed["interview_jobs"] == 1
    assert changed["top_skills"][0]["job_count"] == 1
    assert skill_removed["top_skills"] == []
    assert deleted["total_jobs"] == 0 and deleted["recent_jobs"] == []
