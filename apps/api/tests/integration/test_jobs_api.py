from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime, timedelta
from threading import Event, Thread
from time import monotonic
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, delete, event, func, select, text
from sqlalchemy.orm import Session

from applygauge_api.auth.dependencies import get_current_user
from applygauge_api.auth.models import AuthenticatedUser
from applygauge_api.db.session import get_db_session
from applygauge_api.jobs import service as job_service
from applygauge_api.jobs.models import Company, Job, StatusEvent
from applygauge_api.jobs.normalization import normalize_company_name
from applygauge_api.jobs.schemas import JobCreate, JobUpdate, StatusUpdate
from applygauge_api.main import app

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


def payload(**overrides: object) -> dict[str, object]:
    result: dict[str, object] = {
        "company_name": "Acme Software",
        "title": "Software Engineer",
    }
    result.update(overrides)
    return result


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


def add_company(session: Session, user: AuthenticatedUser, name: str = "Acme") -> Company:
    company = Company(
        user_id=user.id,
        name=name,
        normalized_name=normalize_company_name(name),
    )
    session.add(company)
    session.flush()
    return company


def add_job(
    session: Session,
    user: AuthenticatedUser,
    company: Company,
    job_id: UUID,
    created_at: datetime,
    title: str,
) -> Job:
    job = Job(
        id=job_id,
        user_id=user.id,
        company=company,
        title=title,
        created_at=created_at,
        updated_at=created_at,
        current_status="SAVED",
    )
    session.add(job)
    session.flush()
    return job


def test_authenticated_user_creates_job_and_company(database_session: Session) -> None:
    with client_as(database_session, USER_A) as client:
        response = client.post(
            "/api/v1/jobs",
            json=payload(
                company_name="  Acme   Software ",
                description=" Build useful things. ",
                job_url="https://example.test/jobs/1",
                location=" Remote ",
                work_arrangement="REMOTE",
                employment_type="FULL_TIME",
            ),
        )

    assert response.status_code == 201
    body = response.json()
    assert body["company"]["name"] == "Acme Software"
    assert body["title"] == "Software Engineer"
    assert body["description"] == "Build useful things."
    assert body["job_url"] == "https://example.test/jobs/1"
    assert body["location"] == "Remote"
    assert body["work_arrangement"] == "REMOTE"
    assert body["employment_type"] == "FULL_TIME"
    assert "user_id" not in body
    assert body["current_status"] == "SAVED"

    company = database_session.scalar(select(Company))
    job = database_session.scalar(select(Job))
    assert company is not None
    assert job is not None
    assert company.user_id == USER_A.id
    assert company.name == "Acme Software"
    assert company.normalized_name == "acme software"
    assert job.user_id == USER_A.id
    assert job.company_id == company.id
    event_row = database_session.scalar(select(StatusEvent))
    assert job.current_status == "SAVED"
    assert event_row is not None
    assert event_row.user_id == USER_A.id
    assert event_row.job_id == job.id
    assert event_row.from_status is None
    assert event_row.to_status == "SAVED"
    assert event_row.changed_at == job.created_at


def test_same_normalized_company_is_reused(database_session: Session) -> None:
    with client_as(database_session, USER_A) as client:
        first = client.post("/api/v1/jobs", json=payload(company_name="Acme Software"))
        second = client.post("/api/v1/jobs", json=payload(company_name="  ACME   SOFTWARE "))

    assert first.status_code == second.status_code == 201
    assert first.json()["company"]["id"] == second.json()["company"]["id"]
    assert database_session.scalar(select(func.count()).select_from(Company)) == 1


def test_same_company_name_is_private_per_user(database_session: Session) -> None:
    with client_as(database_session, USER_A) as client:
        first = client.post("/api/v1/jobs", json=payload())
    with client_as(database_session, USER_B) as client:
        second = client.post("/api/v1/jobs", json=payload())

    assert first.status_code == second.status_code == 201
    assert first.json()["company"]["id"] != second.json()["company"]["id"]
    assert database_session.scalar(select(func.count()).select_from(Company)) == 2


def test_nullable_fields_persist_as_null(database_session: Session) -> None:
    with client_as(database_session, USER_A) as client:
        response = client.post(
            "/api/v1/jobs",
            json=payload(description=" ", job_url="", location="  "),
        )

    assert response.status_code == 201
    assert response.json()["description"] is None
    assert response.json()["job_url"] is None
    assert response.json()["location"] is None
    job = database_session.scalar(select(Job))
    assert job is not None
    assert job.description is job.job_url is job.location is None


def test_invalid_create_payload_returns_422_without_partial_data(
    database_session: Session,
) -> None:
    with client_as(database_session, USER_A) as client:
        response = client.post("/api/v1/jobs", json=payload(company_name="   "))

    assert response.status_code == 422
    assert database_session.scalar(select(func.count()).select_from(Company)) == 0
    assert database_session.scalar(select(func.count()).select_from(Job)) == 0


def test_list_is_empty_for_user_without_jobs(database_session: Session) -> None:
    with client_as(database_session, USER_A) as client:
        response = client.get("/api/v1/jobs")

    assert response.status_code == 200
    assert response.json() == {"items": []}


def test_list_returns_only_owned_jobs_with_company(database_session: Session) -> None:
    company_a = add_company(database_session, USER_A, "Acme")
    company_b = add_company(database_session, USER_B, "Beta")
    now = datetime.now(UTC)
    add_job(
        database_session,
        USER_A,
        company_a,
        UUID("00000000-0000-4000-8000-000000000001"),
        now,
        "Owned job",
    )
    add_job(
        database_session,
        USER_B,
        company_b,
        UUID("00000000-0000-4000-8000-000000000002"),
        now,
        "Other user's job",
    )

    with client_as(database_session, USER_A) as client:
        response = client.get("/api/v1/jobs")

    assert response.status_code == 200
    assert [item["title"] for item in response.json()["items"]] == ["Owned job"]
    assert response.json()["items"][0]["company"] == {
        "id": str(company_a.id),
        "name": "Acme",
    }


def test_list_has_deterministic_created_at_then_id_order(database_session: Session) -> None:
    company = add_company(database_session, USER_A)
    now = datetime.now(UTC)
    add_job(
        database_session,
        USER_A,
        company,
        UUID("00000000-0000-4000-8000-000000000001"),
        now,
        "Same time, lower ID",
    )
    add_job(
        database_session,
        USER_A,
        company,
        UUID("00000000-0000-4000-8000-000000000002"),
        now,
        "Same time, higher ID",
    )
    add_job(
        database_session,
        USER_A,
        company,
        UUID("00000000-0000-4000-8000-000000000003"),
        now - timedelta(days=1),
        "Older",
    )

    with client_as(database_session, USER_A) as client:
        response = client.get("/api/v1/jobs")

    assert [item["title"] for item in response.json()["items"]] == [
        "Same time, higher ID",
        "Same time, lower ID",
        "Older",
    ]


def test_owner_can_get_job_with_company(database_session: Session) -> None:
    company = add_company(database_session, USER_A)
    job = add_job(database_session, USER_A, company, UUID(int=1), datetime.now(UTC), "Owned")

    with client_as(database_session, USER_A) as client:
        response = client.get(f"/api/v1/jobs/{job.id}")

    assert response.status_code == 200
    assert response.json()["id"] == str(job.id)
    assert response.json()["company"] == {"id": str(company.id), "name": company.name}


def test_missing_and_non_owned_jobs_have_identical_404(database_session: Session) -> None:
    company = add_company(database_session, USER_A)
    job = add_job(database_session, USER_A, company, UUID(int=1), datetime.now(UTC), "Private")

    with client_as(database_session, USER_B) as client:
        non_owned = client.get(f"/api/v1/jobs/{job.id}")
        missing = client.get(f"/api/v1/jobs/{UUID(int=2)}")

    assert non_owned.status_code == missing.status_code == 404
    assert non_owned.json() == missing.json() == {"detail": "The requested job could not be found."}


@pytest.mark.parametrize(
    ("method", "path", "json"),
    [
        ("post", "/api/v1/jobs", payload()),
        ("get", "/api/v1/jobs", None),
        ("get", f"/api/v1/jobs/{UUID(int=1)}", None),
    ],
)
def test_job_endpoints_require_authentication(
    database_session: Session, method: str, path: str, json: dict[str, object] | None
) -> None:
    with unauthenticated_client(database_session) as client:
        response = client.request(method, path, json=json)

    assert response.status_code == 401


def test_company_integrity_conflict_recovers_winning_row(
    database_session: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    existing = add_company(database_session, USER_A, "Acme Software")
    original_find = job_service._find_company
    calls = 0

    def miss_then_find(session: Session, user_id: UUID, normalized_name: str) -> Company | None:
        nonlocal calls
        calls += 1
        if calls == 1:
            return None
        return original_find(session, user_id, normalized_name)

    monkeypatch.setattr(job_service, "_find_company", miss_then_find)

    job = job_service.create_job(database_session, USER_A, JobCreate.model_validate(payload()))

    assert job.company_id == existing.id
    assert calls == 2
    assert database_session.scalar(select(func.count()).select_from(Company)) == 1


def test_failed_job_creation_rolls_back_new_company(database_session: Session) -> None:
    def fail_when_job_flushes(session: Session, *_args: object) -> None:
        if any(isinstance(item, Job) for item in session.new):
            raise RuntimeError("deterministic job flush failure")

    event.listen(database_session, "before_flush", fail_when_job_flushes)
    try:
        with pytest.raises(RuntimeError, match="deterministic job flush failure"):
            job_service.create_job(database_session, USER_A, JobCreate.model_validate(payload()))
    finally:
        event.remove(database_session, "before_flush", fail_when_job_flushes)

    assert database_session.scalar(select(func.count()).select_from(Company)) == 0
    assert database_session.scalar(select(func.count()).select_from(Job)) == 0


def test_failed_initial_status_event_rolls_back_job_and_company(
    database_session: Session,
) -> None:
    flush_count = 0

    def fail_when_status_event_flushes(session: Session, *_args: object) -> None:
        nonlocal flush_count
        flush_count += 1
        if any(isinstance(item, StatusEvent) for item in session.new):
            raise RuntimeError("deterministic status event flush failure")

    event.listen(database_session, "before_flush", fail_when_status_event_flushes)
    try:
        with pytest.raises(RuntimeError, match="deterministic status event flush failure"):
            job_service.create_job(database_session, USER_A, JobCreate.model_validate(payload()))
    finally:
        event.remove(database_session, "before_flush", fail_when_status_event_flushes)

    assert flush_count >= 2
    assert database_session.scalar(select(func.count()).select_from(Company)) == 0
    assert database_session.scalar(select(func.count()).select_from(Job)) == 0
    assert database_session.scalar(select(func.count()).select_from(StatusEvent)) == 0


def test_owner_updates_title_and_omitted_fields_remain(database_session: Session) -> None:
    company = add_company(database_session, USER_A)
    job = add_job(database_session, USER_A, company, UUID(int=1), datetime.now(UTC), "Old title")
    job.description = "Keep this"
    database_session.flush()

    with client_as(database_session, USER_A) as client:
        response = client.patch(f"/api/v1/jobs/{job.id}", json={"title": " New title "})

    assert response.status_code == 200
    assert response.json()["title"] == "New title"
    assert response.json()["description"] == "Keep this"
    assert response.json()["company"]["id"] == str(company.id)


def test_owner_updates_multiple_fields_and_unknown_enums(database_session: Session) -> None:
    company = add_company(database_session, USER_A)
    job = add_job(database_session, USER_A, company, UUID(int=1), datetime.now(UTC), "Old")

    with client_as(database_session, USER_A) as client:
        response = client.patch(
            f"/api/v1/jobs/{job.id}",
            json={
                "title": "Updated",
                "description": " New description ",
                "job_url": "https://example.test/new",
                "location": " Seattle ",
                "work_arrangement": "UNKNOWN",
                "employment_type": "UNKNOWN",
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Updated"
    assert body["description"] == "New description"
    assert body["job_url"] == "https://example.test/new"
    assert body["location"] == "Seattle"
    assert body["work_arrangement"] == "UNKNOWN"
    assert body["employment_type"] == "UNKNOWN"


def test_owner_explicitly_clears_nullable_fields(database_session: Session) -> None:
    company = add_company(database_session, USER_A)
    job = add_job(database_session, USER_A, company, UUID(int=1), datetime.now(UTC), "Job")
    job.description = "Description"
    job.job_url = "https://example.test/job"
    job.location = "Remote"
    database_session.flush()

    with client_as(database_session, USER_A) as client:
        response = client.patch(
            f"/api/v1/jobs/{job.id}",
            json={"description": None, "job_url": None, "location": None},
        )

    assert response.status_code == 200
    assert response.json()["description"] is None
    assert response.json()["job_url"] is None
    assert response.json()["location"] is None


def test_successful_update_changes_updated_at(database_session: Session) -> None:
    company = add_company(database_session, USER_A)
    old_timestamp = datetime(2020, 1, 1, tzinfo=UTC)
    job = add_job(database_session, USER_A, company, UUID(int=1), old_timestamp, "Old")

    with client_as(database_session, USER_A) as client:
        response = client.patch(f"/api/v1/jobs/{job.id}", json={"title": "Updated"})

    assert response.status_code == 200
    assert datetime.fromisoformat(response.json()["updated_at"]) > old_timestamp


def test_company_reassignment_creates_target_and_retains_old_company(
    database_session: Session,
) -> None:
    old_company = add_company(database_session, USER_A, "Acme")
    job = add_job(database_session, USER_A, old_company, UUID(int=1), datetime.now(UTC), "Job")

    with client_as(database_session, USER_A) as client:
        response = client.patch(f"/api/v1/jobs/{job.id}", json={"company_name": " Stripe "})

    assert response.status_code == 200
    assert response.json()["company"]["name"] == "Stripe"
    companies = list(database_session.scalars(select(Company).order_by(Company.name)))
    assert [company.name for company in companies] == ["Acme", "Stripe"]
    assert database_session.get(Company, old_company.id) is not None


def test_company_reassignment_reuses_existing_normalized_company(
    database_session: Session,
) -> None:
    old_company = add_company(database_session, USER_A, "Acme")
    target_company = add_company(database_session, USER_A, "Stripe")
    job = add_job(database_session, USER_A, old_company, UUID(int=1), datetime.now(UTC), "Job")

    with client_as(database_session, USER_A) as client:
        response = client.patch(f"/api/v1/jobs/{job.id}", json={"company_name": "  STRIPE  "})

    assert response.status_code == 200
    assert response.json()["company"]["id"] == str(target_company.id)
    assert database_session.scalar(select(func.count()).select_from(Company)) == 2
    assert database_session.get(Company, old_company.id) is not None


def test_company_reassignment_does_not_reuse_other_users_company(
    database_session: Session,
) -> None:
    old_company = add_company(database_session, USER_A, "Acme")
    other_company = add_company(database_session, USER_B, "Stripe")
    job = add_job(database_session, USER_A, old_company, UUID(int=1), datetime.now(UTC), "Job")

    with client_as(database_session, USER_A) as client:
        response = client.patch(f"/api/v1/jobs/{job.id}", json={"company_name": "Stripe"})

    assert response.status_code == 200
    assert response.json()["company"]["id"] != str(other_company.id)
    assert database_session.scalar(select(func.count()).select_from(Company)) == 3


@pytest.mark.parametrize("patch_payload", [{}, {"title": None}, {"work_arrangement": "INVALID"}])
def test_invalid_update_returns_422(
    database_session: Session, patch_payload: dict[str, object]
) -> None:
    company = add_company(database_session, USER_A)
    job = add_job(database_session, USER_A, company, UUID(int=1), datetime.now(UTC), "Original")

    with client_as(database_session, USER_A) as client:
        response = client.patch(f"/api/v1/jobs/{job.id}", json=patch_payload)

    assert response.status_code == 422
    database_session.refresh(job)
    assert job.title == "Original"


def test_missing_and_non_owned_updates_have_identical_404_and_do_not_mutate(
    database_session: Session,
) -> None:
    company = add_company(database_session, USER_A)
    job = add_job(database_session, USER_A, company, UUID(int=1), datetime.now(UTC), "Private")

    with client_as(database_session, USER_B) as client:
        non_owned = client.patch(f"/api/v1/jobs/{job.id}", json={"title": "Stolen"})
        missing = client.patch(f"/api/v1/jobs/{UUID(int=2)}", json={"title": "Missing"})

    assert non_owned.status_code == missing.status_code == 404
    assert non_owned.json() == missing.json() == {"detail": "The requested job could not be found."}
    database_session.refresh(job)
    assert job.title == "Private"


def test_failed_update_rolls_back_new_company_and_job_changes(database_session: Session) -> None:
    old_company = add_company(database_session, USER_A, "Acme")
    job = add_job(database_session, USER_A, old_company, UUID(int=1), datetime.now(UTC), "Original")
    database_session.commit()

    def fail_when_job_flushes(session: Session, *_args: object) -> None:
        if any(isinstance(item, Job) for item in session.dirty):
            raise RuntimeError("deterministic update failure")

    event.listen(database_session, "before_flush", fail_when_job_flushes)
    try:
        with pytest.raises(RuntimeError, match="deterministic update failure"):
            job_service.update_job(
                database_session,
                USER_A,
                job.id,
                JobUpdate.model_validate({"company_name": "Stripe", "title": "Changed"}),
            )
    finally:
        event.remove(database_session, "before_flush", fail_when_job_flushes)

    assert database_session.scalar(select(func.count()).select_from(Company)) == 1
    restored_job = database_session.get(Job, job.id)
    assert restored_job is not None
    assert restored_job.title == "Original"
    assert restored_job.company_id == old_company.id


def test_owner_deletes_job_with_empty_204_and_company_remains(database_session: Session) -> None:
    company = add_company(database_session, USER_A)
    job = add_job(database_session, USER_A, company, UUID(int=1), datetime.now(UTC), "Delete me")

    with client_as(database_session, USER_A) as client:
        response = client.delete(f"/api/v1/jobs/{job.id}")
        detail = client.get(f"/api/v1/jobs/{job.id}")
        listing = client.get("/api/v1/jobs")

    assert response.status_code == 204
    assert response.content == b""
    assert detail.status_code == 404
    assert listing.json() == {"items": []}
    assert database_session.get(Company, company.id) is not None


def test_missing_and_non_owned_deletes_have_identical_404_and_job_remains(
    database_session: Session,
) -> None:
    company = add_company(database_session, USER_A)
    job = add_job(database_session, USER_A, company, UUID(int=1), datetime.now(UTC), "Private")

    with client_as(database_session, USER_B) as client:
        non_owned = client.delete(f"/api/v1/jobs/{job.id}")
        missing = client.delete(f"/api/v1/jobs/{UUID(int=2)}")

    assert non_owned.status_code == missing.status_code == 404
    assert non_owned.json() == missing.json() == {"detail": "The requested job could not be found."}
    assert database_session.get(Job, job.id) is not None


@pytest.mark.parametrize("method", ["patch", "delete"])
def test_job_mutations_require_authentication(database_session: Session, method: str) -> None:
    with unauthenticated_client(database_session) as client:
        response = client.request(method, f"/api/v1/jobs/{UUID(int=1)}", json={"title": "No"})

    assert response.status_code == 401


def test_job_status_is_in_create_list_detail_and_metadata_update_responses(
    database_session: Session,
) -> None:
    with client_as(database_session, USER_A) as client:
        created = client.post("/api/v1/jobs", json=payload())
        job_id = created.json()["id"]
        listing = client.get("/api/v1/jobs")
        detail = client.get(f"/api/v1/jobs/{job_id}")
        updated = client.patch(f"/api/v1/jobs/{job_id}", json={"title": "Updated"})

    assert created.json()["current_status"] == "SAVED"
    assert listing.json()["items"][0]["current_status"] == "SAVED"
    assert detail.json()["current_status"] == "SAVED"
    assert updated.json()["current_status"] == "SAVED"
    assert database_session.scalar(select(func.count()).select_from(StatusEvent)) == 1


def test_status_transitions_append_ordered_history(database_session: Session) -> None:
    with client_as(database_session, USER_A) as client:
        created = client.post("/api/v1/jobs", json=payload())
        job_id = created.json()["id"]
        applied = client.patch(f"/api/v1/jobs/{job_id}/status", json={"status": "APPLIED"})
        screening = client.patch(f"/api/v1/jobs/{job_id}/status", json={"status": "SCREENING"})
        history = client.get(f"/api/v1/jobs/{job_id}/status-events")

    assert applied.status_code == screening.status_code == 200
    assert applied.json()["current_status"] == "APPLIED"
    assert screening.json()["current_status"] == "SCREENING"
    items = history.json()["items"]
    assert [(item["from_status"], item["to_status"]) for item in items] == [
        (None, "SAVED"),
        ("SAVED", "APPLIED"),
        ("APPLIED", "SCREENING"),
    ]
    assert all(set(item) == {"id", "from_status", "to_status", "changed_at"} for item in items)
    timestamps = [datetime.fromisoformat(item["changed_at"]) for item in items]
    assert timestamps == sorted(timestamps)
    stored_job = database_session.get(Job, UUID(job_id))
    assert stored_job is not None and stored_job.current_status == "SCREENING"


def test_status_correction_is_unrestricted(database_session: Session) -> None:
    with client_as(database_session, USER_A) as client:
        job_id = client.post("/api/v1/jobs", json=payload()).json()["id"]
        assert (
            client.patch(f"/api/v1/jobs/{job_id}/status", json={"status": "REJECTED"}).status_code
            == 200
        )
        corrected = client.patch(f"/api/v1/jobs/{job_id}/status", json={"status": "INTERVIEW"})

    assert corrected.status_code == 200
    assert corrected.json()["current_status"] == "INTERVIEW"


def test_same_status_is_409_without_mutation(database_session: Session) -> None:
    with client_as(database_session, USER_A) as client:
        created = client.post("/api/v1/jobs", json=payload())
        job_id = UUID(created.json()["id"])
        job = database_session.get(Job, job_id)
        assert job is not None
        original_updated_at = job.updated_at
        response = client.patch(f"/api/v1/jobs/{job_id}/status", json={"status": "SAVED"})

    assert response.status_code == 409
    assert response.json() == {"detail": "The job already has the requested status."}
    database_session.refresh(job)
    assert job.current_status == "SAVED"
    assert job.updated_at == original_updated_at
    assert database_session.scalar(select(func.count()).select_from(StatusEvent)) == 1


@pytest.mark.parametrize(
    "invalid_payload",
    [{}, {"status": None}, {"status": "INVALID"}, {"status": "APPLIED", "extra": True}],
)
def test_invalid_status_payload_is_422(
    database_session: Session, invalid_payload: dict[str, object]
) -> None:
    with client_as(database_session, USER_A) as client:
        job_id = client.post("/api/v1/jobs", json=payload()).json()["id"]
        response = client.patch(f"/api/v1/jobs/{job_id}/status", json=invalid_payload)
    assert response.status_code == 422
    assert database_session.scalar(select(func.count()).select_from(StatusEvent)) == 1


def test_status_endpoints_preserve_nondisclosure(database_session: Session) -> None:
    with client_as(database_session, USER_A) as client:
        job_id = client.post("/api/v1/jobs", json=payload()).json()["id"]
    missing_id = UUID(int=99)
    with client_as(database_session, USER_B) as client:
        foreign_transition = client.patch(
            f"/api/v1/jobs/{job_id}/status", json={"status": "APPLIED"}
        )
        missing_transition = client.patch(
            f"/api/v1/jobs/{missing_id}/status", json={"status": "APPLIED"}
        )
        foreign_history = client.get(f"/api/v1/jobs/{job_id}/status-events")
        missing_history = client.get(f"/api/v1/jobs/{missing_id}/status-events")

    expected = {"detail": "The requested job could not be found."}
    assert foreign_transition.status_code == missing_transition.status_code == 404
    assert foreign_transition.json() == missing_transition.json() == expected
    assert foreign_history.status_code == missing_history.status_code == 404
    assert foreign_history.json() == missing_history.json() == expected
    job = database_session.get(Job, UUID(job_id))
    assert job is not None and job.current_status == "SAVED"
    assert database_session.scalar(select(func.count()).select_from(StatusEvent)) == 1


@pytest.mark.parametrize("suffix", ["status", "status-events"])
def test_status_endpoints_require_authentication(database_session: Session, suffix: str) -> None:
    with unauthenticated_client(database_session) as client:
        response = client.request(
            "patch" if suffix == "status" else "get",
            f"/api/v1/jobs/{UUID(int=1)}/{suffix}",
            json={"status": "APPLIED"} if suffix == "status" else None,
        )
    assert response.status_code == 401


def test_transition_failure_rolls_back_snapshot_and_event(database_session: Session) -> None:
    job = job_service.create_job(database_session, USER_A, JobCreate.model_validate(payload()))

    def fail_event_flush(session: Session, *_args: object) -> None:
        if any(isinstance(item, StatusEvent) for item in session.new):
            raise RuntimeError("deterministic transition event failure")

    event.listen(database_session, "before_flush", fail_event_flush)
    try:
        with pytest.raises(RuntimeError, match="deterministic transition event failure"):
            job_service.transition_job_status(
                database_session,
                USER_A,
                job.id,
                StatusUpdate.model_validate({"status": "APPLIED"}),
            )
    finally:
        event.remove(database_session, "before_flush", fail_event_flush)

    restored = database_session.get(Job, job.id)
    assert restored is not None and restored.current_status == "SAVED"
    assert database_session.scalar(select(func.count()).select_from(StatusEvent)) == 1


def test_metadata_patch_preserves_status_history(database_session: Session) -> None:
    with client_as(database_session, USER_A) as client:
        job_id = client.post("/api/v1/jobs", json=payload()).json()["id"]
        client.patch(f"/api/v1/jobs/{job_id}/status", json={"status": "APPLIED"})
        updated = client.patch(f"/api/v1/jobs/{job_id}", json={"title": "Metadata only"})
        rejected = client.patch(f"/api/v1/jobs/{job_id}", json={"current_status": "SAVED"})
    assert updated.status_code == 200
    assert updated.json()["current_status"] == "APPLIED"
    assert rejected.status_code == 422
    job = database_session.get(Job, UUID(job_id))
    assert job is not None and job.current_status == "APPLIED" and job.title == "Metadata only"
    assert database_session.scalar(select(func.count()).select_from(StatusEvent)) == 2


def test_delete_after_transitions_cascades_history_and_retains_company(
    database_session: Session,
) -> None:
    with client_as(database_session, USER_A) as client:
        created = client.post("/api/v1/jobs", json=payload())
        job_id = UUID(created.json()["id"])
        company_id = UUID(created.json()["company"]["id"])
        client.patch(f"/api/v1/jobs/{job_id}/status", json={"status": "APPLIED"})
        client.patch(f"/api/v1/jobs/{job_id}/status", json={"status": "SCREENING"})
        response = client.delete(f"/api/v1/jobs/{job_id}")
    assert response.status_code == 204
    assert (
        database_session.scalar(
            select(func.count()).select_from(StatusEvent).where(StatusEvent.job_id == job_id)
        )
        == 0
    )
    assert database_session.get(Company, company_id) is not None


def test_concurrent_transitions_serialize_from_the_latest_status(
    migrated_database_url: str,
) -> None:
    engine = create_engine(migrated_database_url)
    worker_started = Event()
    worker_finished = Event()
    worker_pid: list[int] = []
    worker_errors: list[BaseException] = []

    with Session(engine) as setup_session:
        job = job_service.create_job(
            setup_session,
            USER_A,
            JobCreate.model_validate(payload(company_name="Concurrency Company")),
        )
        job_id, company_id = job.id, job.company_id

    def run_competing_transition() -> None:
        try:
            with Session(engine) as worker_session:
                worker_pid.append(worker_session.scalar(select(func.pg_backend_pid())) or 0)
                worker_started.set()
                job_service.transition_job_status(
                    worker_session,
                    USER_A,
                    job_id,
                    StatusUpdate.model_validate({"status": "SCREENING"}),
                )
        except BaseException as exc:
            worker_errors.append(exc)
        finally:
            worker_finished.set()

    try:
        with Session(engine) as first_session:
            locked_job = first_session.scalar(
                select(Job).where(Job.id == job_id, Job.user_id == USER_A.id).with_for_update()
            )
            assert locked_job is not None
            worker = Thread(target=run_competing_transition, daemon=True)
            worker.start()
            assert worker_started.wait(timeout=5)

            deadline = monotonic() + 5
            is_blocked = False
            with engine.connect() as observer:
                while monotonic() < deadline:
                    is_blocked = bool(
                        observer.scalar(
                            text("SELECT cardinality(pg_blocking_pids(:pid)) > 0"),
                            {"pid": worker_pid[0]},
                        )
                    )
                    if is_blocked:
                        break
            assert is_blocked

            first_result = job_service.transition_job_status(
                first_session,
                USER_A,
                job_id,
                StatusUpdate.model_validate({"status": "APPLIED"}),
            )
            assert first_result.current_status == "APPLIED"

        assert worker_finished.wait(timeout=5)
        worker.join(timeout=5)
        assert not worker.is_alive()
        assert worker_errors == []

        with Session(engine) as verification_session:
            stored_job = verification_session.get(Job, job_id)
            history = job_service.list_status_events(verification_session, USER_A.id, job_id)
            assert stored_job is not None and stored_job.current_status == "SCREENING"
            assert [(item.from_status, item.to_status) for item in history] == [
                (None, "SAVED"),
                ("SAVED", "APPLIED"),
                ("APPLIED", "SCREENING"),
            ]
    finally:
        with Session(engine) as cleanup_session:
            cleanup_session.execute(delete(Job).where(Job.id == job_id))
            cleanup_session.execute(delete(Company).where(Company.id == company_id))
            cleanup_session.commit()
        engine.dispose()
