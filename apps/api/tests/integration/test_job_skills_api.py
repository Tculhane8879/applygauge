from collections.abc import Iterator
from contextlib import contextmanager
from threading import Barrier, Thread
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, delete, event, func, select
from sqlalchemy.orm import Session

from applygauge_api.auth.dependencies import get_current_user
from applygauge_api.auth.models import AuthenticatedUser
from applygauge_api.db.session import get_db_session
from applygauge_api.jobs.models import Company, Job
from applygauge_api.jobs.normalization import normalize_company_name
from applygauge_api.main import app
from applygauge_api.skills import service as skill_service
from applygauge_api.skills.models import JobSkill, Skill, SkillTerm
from applygauge_api.skills.schemas import SkillAdd

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


@contextmanager
def unauthenticated_client(session: Session) -> Iterator[TestClient]:
    app.dependency_overrides[get_db_session] = lambda: session
    try:
        with TestClient(app) as client:
            yield client
    finally:
        app.dependency_overrides.clear()


def add_job(session: Session, user: AuthenticatedUser) -> Job:
    company = Company(
        user_id=user.id,
        name=f"Company {uuid4()}",
        normalized_name=normalize_company_name(f"Company {uuid4()}"),
    )
    session.add(company)
    session.flush()
    job = Job(
        user_id=user.id,
        company_id=company.id,
        title="Engineer",
        current_status="SAVED",
    )
    session.add(job)
    session.flush()
    return job


def seeded_skill(session: Session, name: str) -> Skill:
    skill = session.scalar(select(Skill).where(Skill.name == name))
    assert skill is not None
    return skill


def test_owner_lists_empty_and_canonical_skills_in_deterministic_order(
    database_session: Session,
) -> None:
    job = add_job(database_session, USER_A)
    with client_as(database_session, USER_A) as client:
        empty = client.get(f"/api/v1/jobs/{job.id}/skills")
        client.post(f"/api/v1/jobs/{job.id}/skills", json={"name": "typescript"})
        client.post(f"/api/v1/jobs/{job.id}/skills", json={"name": "ReactJS"})
        client.post(f"/api/v1/jobs/{job.id}/skills", json={"name": "postgres"})
        populated = client.get(f"/api/v1/jobs/{job.id}/skills")

    assert empty.status_code == 200 and empty.json() == {"items": []}
    assert [item["name"] for item in populated.json()["items"]] == [
        "PostgreSQL",
        "React",
        "TypeScript",
    ]
    assert all("user_id" not in item and "job_id" not in item for item in populated.json()["items"])


def test_add_canonical_skill_creates_private_association(database_session: Session) -> None:
    job = add_job(database_session, USER_A)
    with client_as(database_session, USER_A) as client:
        response = client.post(f"/api/v1/jobs/{job.id}/skills", json={"name": "Python"})

    assert response.status_code == 201
    assert response.json()["name"] == "Python"
    skill_id = UUID(response.json()["id"])
    association = database_session.get(JobSkill, (job.id, skill_id))
    assert association is not None and association.user_id == USER_A.id


@pytest.mark.parametrize(
    ("submitted", "expected"),
    [
        ("  postgres  ", "PostgreSQL"),
        ("POSTGRES", "PostgreSQL"),
        ("psql", "PostgreSQL"),
        ("ReactJS", "React"),
        ("NodeJS", "Node.js"),
        ("cpp", "C++"),
        ("csharp", "C#"),
    ],
)
def test_aliases_resolve_to_canonical_skill(
    database_session: Session, submitted: str, expected: str
) -> None:
    job = add_job(database_session, USER_A)
    with client_as(database_session, USER_A) as client:
        response = client.post(f"/api/v1/jobs/{job.id}/skills", json={"name": submitted})
    assert response.status_code == 201
    assert response.json()["name"] == expected


def test_punctuation_sensitive_canonical_skills_remain_distinct(database_session: Session) -> None:
    job = add_job(database_session, USER_A)
    with client_as(database_session, USER_A) as client:
        c_response = client.post(f"/api/v1/jobs/{job.id}/skills", json={"name": "C"})
        cpp_response = client.post(f"/api/v1/jobs/{job.id}/skills", json={"name": "C++"})
    assert c_response.status_code == cpp_response.status_code == 201
    assert c_response.json()["id"] != cpp_response.json()["id"]


@pytest.mark.parametrize(
    "names",
    [
        ("Python", "Python"),
        ("Postgres", "PostgreSQL"),
        ("PostgreSQL", "psql"),
    ],
)
def test_duplicate_add_is_idempotent(database_session: Session, names: tuple[str, str]) -> None:
    job = add_job(database_session, USER_A)
    with client_as(database_session, USER_A) as client:
        first = client.post(f"/api/v1/jobs/{job.id}/skills", json={"name": names[0]})
        second = client.post(f"/api/v1/jobs/{job.id}/skills", json={"name": names[1]})
    assert first.status_code == 201
    assert second.status_code == 200
    assert first.json() == second.json()
    assert (
        database_session.scalar(
            select(func.count()).select_from(JobSkill).where(JobSkill.job_id == job.id)
        )
        == 1
    )


def test_unknown_skill_is_422_without_catalog_or_association_mutation(
    database_session: Session,
) -> None:
    job = add_job(database_session, USER_A)
    original_skills = database_session.scalar(select(func.count()).select_from(Skill))
    original_terms = database_session.scalar(select(func.count()).select_from(SkillTerm))
    with client_as(database_session, USER_A) as client:
        response = client.post(f"/api/v1/jobs/{job.id}/skills", json={"name": "Unknown Framework"})
    assert response.status_code == 422
    assert response.json() == {"detail": "That skill is not available in the catalog."}
    assert database_session.scalar(select(func.count()).select_from(Skill)) == original_skills
    assert database_session.scalar(select(func.count()).select_from(SkillTerm)) == original_terms
    assert database_session.scalar(select(func.count()).select_from(JobSkill)) == 0


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"name": None},
        {"name": " "},
        {"name": "Python", "user_id": str(USER_B.id)},
        {"name": "Python", "skill_id": str(uuid4())},
        {"name": "Python", "category": "LANGUAGE"},
        {"name": "Python", "source": "MANUAL"},
    ],
)
def test_invalid_or_injected_add_payload_is_422(
    database_session: Session, payload: dict[str, object]
) -> None:
    job = add_job(database_session, USER_A)
    with client_as(database_session, USER_A) as client:
        response = client.post(f"/api/v1/jobs/{job.id}/skills", json=payload)
    assert response.status_code == 422
    assert database_session.scalar(select(func.count()).select_from(JobSkill)) == 0


def test_remove_is_idempotent_and_preserves_global_catalog(database_session: Session) -> None:
    job = add_job(database_session, USER_A)
    python = seeded_skill(database_session, "Python")
    with client_as(database_session, USER_A) as client:
        client.post(f"/api/v1/jobs/{job.id}/skills", json={"name": "Python"})
        first = client.delete(f"/api/v1/jobs/{job.id}/skills/{python.id}")
        repeated = client.delete(f"/api/v1/jobs/{job.id}/skills/{python.id}")
        unknown = client.delete(f"/api/v1/jobs/{job.id}/skills/{uuid4()}")
    assert first.status_code == repeated.status_code == unknown.status_code == 204
    assert database_session.get(JobSkill, (job.id, python.id)) is None
    assert database_session.get(Skill, python.id) is not None
    assert (
        database_session.scalar(select(SkillTerm).where(SkillTerm.skill_id == python.id))
        is not None
    )


def test_remove_does_not_touch_another_jobs_association(database_session: Session) -> None:
    first_job = add_job(database_session, USER_A)
    second_job = add_job(database_session, USER_A)
    python = seeded_skill(database_session, "Python")
    with client_as(database_session, USER_A) as client:
        client.post(f"/api/v1/jobs/{first_job.id}/skills", json={"name": "Python"})
        client.post(f"/api/v1/jobs/{second_job.id}/skills", json={"name": "Python"})
        response = client.delete(f"/api/v1/jobs/{first_job.id}/skills/{python.id}")
    assert response.status_code == 204
    assert database_session.get(JobSkill, (first_job.id, python.id)) is None
    assert database_session.get(JobSkill, (second_job.id, python.id)) is not None


def test_foreign_and_missing_jobs_are_nondisclosing(database_session: Session) -> None:
    foreign_job = add_job(database_session, USER_A)
    python = seeded_skill(database_session, "Python")
    missing_id = uuid4()
    with client_as(database_session, USER_B) as client:
        responses = [
            client.get(f"/api/v1/jobs/{foreign_job.id}/skills"),
            client.get(f"/api/v1/jobs/{missing_id}/skills"),
            client.post(f"/api/v1/jobs/{foreign_job.id}/skills", json={"name": "Python"}),
            client.post(f"/api/v1/jobs/{missing_id}/skills", json={"name": "Python"}),
            client.delete(f"/api/v1/jobs/{foreign_job.id}/skills/{python.id}"),
            client.delete(f"/api/v1/jobs/{missing_id}/skills/{python.id}"),
        ]
    assert all(response.status_code == 404 for response in responses)
    assert all(
        response.json() == {"detail": "The requested job could not be found."}
        for response in responses
    )
    assert database_session.scalar(select(func.count()).select_from(JobSkill)) == 0


@pytest.mark.parametrize(
    ("method", "suffix", "json"),
    [
        ("get", "", None),
        ("post", "", {"name": "Python"}),
        ("delete", f"/{uuid4()}", None),
    ],
)
def test_skill_endpoints_require_authentication(
    database_session: Session, method: str, suffix: str, json: dict[str, str] | None
) -> None:
    with unauthenticated_client(database_session) as client:
        response = client.request(method, f"/api/v1/jobs/{uuid4()}/skills{suffix}", json=json)
    assert response.status_code == 401


def test_job_delete_cascades_associations_and_retains_catalog(database_session: Session) -> None:
    job = add_job(database_session, USER_A)
    python = seeded_skill(database_session, "Python")
    postgres = seeded_skill(database_session, "PostgreSQL")
    with client_as(database_session, USER_A) as client:
        client.post(f"/api/v1/jobs/{job.id}/skills", json={"name": "Python"})
        client.post(f"/api/v1/jobs/{job.id}/skills", json={"name": "Postgres"})
        response = client.delete(f"/api/v1/jobs/{job.id}")
    assert response.status_code == 204
    assert (
        database_session.scalar(
            select(func.count()).select_from(JobSkill).where(JobSkill.job_id == job.id)
        )
        == 0
    )
    assert database_session.get(Skill, python.id) is not None
    assert database_session.get(Skill, postgres.id) is not None


def test_job_metadata_writes_cannot_mutate_skill_associations(database_session: Session) -> None:
    job = add_job(database_session, USER_A)
    python = seeded_skill(database_session, "Python")
    with client_as(database_session, USER_A) as client:
        client.post(f"/api/v1/jobs/{job.id}/skills", json={"name": "Python"})
        updated = client.patch(f"/api/v1/jobs/{job.id}", json={"title": "Updated title"})
        rejected_update = client.patch(f"/api/v1/jobs/{job.id}", json={"skills": []})
        rejected_create = client.post(
            "/api/v1/jobs",
            json={"company_name": "Injected", "title": "Engineer", "skills": ["Python"]},
        )
    assert updated.status_code == 200 and updated.json()["title"] == "Updated title"
    assert rejected_update.status_code == rejected_create.status_code == 422
    assert database_session.get(JobSkill, (job.id, python.id)) is not None
    stored_job = database_session.get(Job, job.id)
    assert stored_job is not None and stored_job.current_status == "SAVED"


def test_add_failure_rolls_back_association(database_session: Session) -> None:
    job = add_job(database_session, USER_A)

    def fail_job_skill_insert(
        _connection: object,
        _cursor: object,
        statement: str,
        _parameters: object,
        _context: object,
        _executemany: bool,
    ) -> None:
        if statement.startswith("INSERT INTO job_skills"):
            raise RuntimeError("deterministic association insert failure")

    bind = database_session.get_bind()
    event.listen(bind, "before_cursor_execute", fail_job_skill_insert)
    try:
        with pytest.raises(RuntimeError, match="deterministic association insert failure"):
            skill_service.add_job_skill(
                database_session,
                USER_A.id,
                job.id,
                SkillAdd(name="Python"),
            )
    finally:
        event.remove(bind, "before_cursor_execute", fail_job_skill_insert)
    assert (
        database_session.scalar(
            select(func.count()).select_from(JobSkill).where(JobSkill.job_id == job.id)
        )
        == 0
    )


def test_concurrent_duplicate_adds_use_database_conflict_resolution(
    migrated_database_url: str,
) -> None:
    engine = create_engine(migrated_database_url)
    barrier = Barrier(2, timeout=5)
    results: list[tuple[bool, UUID]] = []
    errors: list[BaseException] = []

    with Session(engine) as setup_session:
        job = add_job(setup_session, USER_A)
        setup_session.commit()
        job_id, company_id = job.id, job.company_id

    def synchronize_inserts(
        _connection: object,
        _cursor: object,
        statement: str,
        _parameters: object,
        _context: object,
        _executemany: bool,
    ) -> None:
        if statement.startswith("INSERT INTO job_skills"):
            barrier.wait()

    def add_from_independent_session() -> None:
        try:
            with Session(engine) as session:
                result = skill_service.add_job_skill(
                    session,
                    USER_A.id,
                    job_id,
                    SkillAdd(name="Postgres"),
                )
                results.append((result.created, result.skill.id))
        except BaseException as exc:
            errors.append(exc)

    event.listen(engine, "before_cursor_execute", synchronize_inserts)
    try:
        workers = [Thread(target=add_from_independent_session, daemon=True) for _ in range(2)]
        for worker in workers:
            worker.start()
        for worker in workers:
            worker.join(timeout=10)
        assert all(not worker.is_alive() for worker in workers)
        assert errors == []
        assert sorted(created for created, _skill_id in results) == [False, True]
        assert len({skill_id for _created, skill_id in results}) == 1
        with Session(engine) as verification_session:
            stored = skill_service.list_job_skills(verification_session, USER_A.id, job_id)
            assert [skill.name for skill in stored] == ["PostgreSQL"]
            assert (
                verification_session.scalar(
                    select(func.count()).select_from(JobSkill).where(JobSkill.job_id == job_id)
                )
                == 1
            )
    finally:
        event.remove(engine, "before_cursor_execute", synchronize_inserts)
        with Session(engine) as cleanup_session:
            cleanup_session.execute(delete(Job).where(Job.id == job_id))
            cleanup_session.execute(delete(Company).where(Company.id == company_id))
            cleanup_session.commit()
        engine.dispose()
