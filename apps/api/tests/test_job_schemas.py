from datetime import UTC, datetime
from uuid import uuid4

import pytest
from pydantic import ValidationError

from applygauge_api.jobs.schemas import (
    EmploymentType,
    JobCreate,
    JobRead,
    JobUpdate,
    StatusEventRead,
    StatusUpdate,
    WorkArrangement,
)
from applygauge_api.jobs.statuses import ApplicationStatus


def valid_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "company_name": "Acme",
        "title": "Software Engineer",
    }
    payload.update(overrides)
    return payload


def test_company_name_normalizes_display_whitespace() -> None:
    job = JobCreate.model_validate(valid_payload(company_name="  Acme   Software\t "))

    assert job.company_name == "Acme Software"


@pytest.mark.parametrize("company_name", ["", "   ", "\t\n"])
def test_blank_company_name_is_rejected(company_name: str) -> None:
    with pytest.raises(ValidationError):
        JobCreate.model_validate(valid_payload(company_name=company_name))


def test_company_name_maximum_is_enforced_after_normalization() -> None:
    assert len(JobCreate.model_validate(valid_payload(company_name="A" * 150)).company_name) == 150
    with pytest.raises(ValidationError):
        JobCreate.model_validate(valid_payload(company_name="A" * 151))


def test_title_trims_outer_whitespace_without_collapsing_internal_spacing() -> None:
    job = JobCreate.model_validate(valid_payload(title="  Senior   Engineer  "))

    assert job.title == "Senior   Engineer"


@pytest.mark.parametrize("title", ["", "   "])
def test_blank_title_is_rejected(title: str) -> None:
    with pytest.raises(ValidationError):
        JobCreate.model_validate(valid_payload(title=title))


def test_title_maximum_is_enforced_after_trimming() -> None:
    assert len(JobCreate.model_validate(valid_payload(title="T" * 200)).title) == 200
    with pytest.raises(ValidationError):
        JobCreate.model_validate(valid_payload(title="T" * 201))


def test_blank_description_becomes_null() -> None:
    assert JobCreate.model_validate(valid_payload(description=" \n\t ")).description is None


def test_description_preserves_internal_formatting() -> None:
    job = JobCreate.model_validate(valid_payload(description=" \nFirst line\n  Second line\n "))

    assert job.description == "First line\n  Second line"


def test_description_maximum_is_enforced() -> None:
    assert (
        len(JobCreate.model_validate(valid_payload(description="D" * 100_000)).description or "")
        == 100_000
    )
    with pytest.raises(ValidationError):
        JobCreate.model_validate(valid_payload(description="D" * 100_001))


def test_blank_location_becomes_null_and_maximum_is_enforced() -> None:
    assert JobCreate.model_validate(valid_payload(location="   ")).location is None
    assert len(JobCreate.model_validate(valid_payload(location="L" * 200)).location or "") == 200
    with pytest.raises(ValidationError):
        JobCreate.model_validate(valid_payload(location="L" * 201))


def test_blank_job_url_becomes_null() -> None:
    assert JobCreate.model_validate(valid_payload(job_url="   ")).job_url is None


@pytest.mark.parametrize("url", ["http://example.test/job", "https://example.test/job"])
def test_http_job_url_is_accepted(url: str) -> None:
    job = JobCreate.model_validate(valid_payload(job_url=url))

    assert str(job.job_url) == url


@pytest.mark.parametrize("url", ["ftp://example.test/job", "example.test/job", "/jobs/1"])
def test_invalid_or_non_http_job_url_is_rejected(url: str) -> None:
    with pytest.raises(ValidationError):
        JobCreate.model_validate(valid_payload(job_url=url))


def test_enum_defaults_are_unknown() -> None:
    job = JobCreate.model_validate(valid_payload())

    assert job.work_arrangement is WorkArrangement.UNKNOWN
    assert job.employment_type is EmploymentType.UNKNOWN


@pytest.mark.parametrize(
    ("field", "value"),
    [("work_arrangement", "ANYWHERE"), ("employment_type", "PERMANENT")],
)
def test_invalid_enum_value_is_rejected(field: str, value: str) -> None:
    with pytest.raises(ValidationError):
        JobCreate.model_validate(valid_payload(**{field: value}))


def test_ownership_and_generated_fields_are_not_accepted() -> None:
    with pytest.raises(ValidationError):
        JobCreate.model_validate(valid_payload(user_id="11111111-1111-4111-8111-111111111111"))


def test_empty_job_update_is_rejected() -> None:
    with pytest.raises(ValidationError):
        JobUpdate.model_validate({})


def test_job_update_distinguishes_omitted_and_supplied_fields() -> None:
    update = JobUpdate.model_validate({"description": None})

    assert update.model_fields_set == {"description"}
    assert "title" not in update.model_fields_set


def test_title_update_is_normalized() -> None:
    update = JobUpdate.model_validate({"title": "  Senior   Engineer  "})

    assert update.title == "Senior   Engineer"


@pytest.mark.parametrize("title", [None, "", "   "])
def test_null_or_blank_update_title_is_rejected(title: object) -> None:
    with pytest.raises(ValidationError):
        JobUpdate.model_validate({"title": title})


def test_company_update_is_normalized() -> None:
    update = JobUpdate.model_validate({"company_name": "  Stripe   Labs "})

    assert update.company_name == "Stripe Labs"


@pytest.mark.parametrize("company_name", [None, "", "   "])
def test_null_or_blank_update_company_is_rejected(company_name: object) -> None:
    with pytest.raises(ValidationError):
        JobUpdate.model_validate({"company_name": company_name})


@pytest.mark.parametrize("field", ["description", "job_url", "location"])
def test_nullable_update_field_accepts_null(field: str) -> None:
    update = JobUpdate.model_validate({field: None})

    assert field in update.model_fields_set
    assert getattr(update, field) is None


@pytest.mark.parametrize("field", ["description", "job_url", "location"])
def test_blank_nullable_update_field_becomes_null(field: str) -> None:
    update = JobUpdate.model_validate({field: "   "})

    assert getattr(update, field) is None


def test_invalid_update_url_is_rejected() -> None:
    with pytest.raises(ValidationError):
        JobUpdate.model_validate({"job_url": "ftp://example.test/job"})


@pytest.mark.parametrize("field", ["work_arrangement", "employment_type"])
def test_null_update_enum_is_rejected(field: str) -> None:
    with pytest.raises(ValidationError):
        JobUpdate.model_validate({field: None})


@pytest.mark.parametrize(
    ("field", "value"),
    [("work_arrangement", "ANYWHERE"), ("employment_type", "PERMANENT")],
)
def test_invalid_update_enum_is_rejected(field: str, value: str) -> None:
    with pytest.raises(ValidationError):
        JobUpdate.model_validate({field: value})


@pytest.mark.parametrize(
    "field",
    ["id", "user_id", "company_id", "created_at", "updated_at"],
)
def test_job_update_rejects_generated_and_ownership_fields(field: str) -> None:
    with pytest.raises(ValidationError):
        JobUpdate.model_validate({field: "not-accepted"})


@pytest.mark.parametrize("status", list(ApplicationStatus))
def test_status_update_accepts_every_application_status(status: ApplicationStatus) -> None:
    assert StatusUpdate.model_validate({"status": status}).status is status


@pytest.mark.parametrize(
    "payload", [{}, {"status": None}, {"status": "INVALID"}, {"status": "SAVED", "extra": True}]
)
def test_status_update_rejects_invalid_payloads(payload: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        StatusUpdate.model_validate(payload)


def test_job_read_serializes_current_status_without_changing_existing_fields() -> None:
    job_id, company_id = uuid4(), uuid4()
    result = JobRead.model_validate(
        {
            "id": job_id,
            "company": {"id": company_id, "name": "Acme"},
            "title": "Engineer",
            "job_url": None,
            "location": None,
            "work_arrangement": "UNKNOWN",
            "employment_type": "UNKNOWN",
            "current_status": "SAVED",
            "description": None,
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }
    )
    assert result.id == job_id
    assert result.company.id == company_id
    assert result.current_status is ApplicationStatus.SAVED


@pytest.mark.parametrize(("from_status", "to_status"), [(None, "SAVED"), ("SAVED", "APPLIED")])
def test_status_event_read_serializes_without_ownership_fields(
    from_status: str | None, to_status: str
) -> None:
    result = StatusEventRead.model_validate(
        {
            "id": uuid4(),
            "user_id": uuid4(),
            "job_id": uuid4(),
            "from_status": from_status,
            "to_status": to_status,
            "changed_at": datetime.now(UTC),
        }
    )
    assert result.model_dump().keys() == {"id", "from_status", "to_status", "changed_at"}
