from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator


def _normalize_company_display_name(value: object) -> object:
    if isinstance(value, str):
        return " ".join(value.strip().split())
    return value


def _trim_text(value: object) -> object:
    return value.strip() if isinstance(value, str) else value


def _normalize_nullable_text(value: object) -> object:
    if not isinstance(value, str):
        return value
    normalized = value.strip()
    return normalized or None


def _normalize_nullable_url(value: object) -> object:
    if isinstance(value, str):
        normalized = value.strip()
        return normalized or None
    return value


def _reject_null(value: object) -> object:
    if value is None:
        raise ValueError("Field cannot be null.")
    return value


class WorkArrangement(StrEnum):
    UNKNOWN = "UNKNOWN"
    REMOTE = "REMOTE"
    HYBRID = "HYBRID"
    ONSITE = "ONSITE"


class EmploymentType(StrEnum):
    UNKNOWN = "UNKNOWN"
    FULL_TIME = "FULL_TIME"
    PART_TIME = "PART_TIME"
    CONTRACT = "CONTRACT"
    INTERNSHIP = "INTERNSHIP"


class JobCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    company_name: str = Field(min_length=1, max_length=150)
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=100_000)
    job_url: HttpUrl | None = None
    location: str | None = Field(default=None, max_length=200)
    work_arrangement: WorkArrangement = WorkArrangement.UNKNOWN
    employment_type: EmploymentType = EmploymentType.UNKNOWN

    @field_validator("company_name", mode="before")
    @classmethod
    def normalize_company_display_name(cls, value: object) -> object:
        return _normalize_company_display_name(value)

    @field_validator("title", mode="before")
    @classmethod
    def trim_title(cls, value: object) -> object:
        return _trim_text(value)

    @field_validator("description", "location", mode="before")
    @classmethod
    def normalize_nullable_text(cls, value: object) -> object:
        return _normalize_nullable_text(value)

    @field_validator("job_url", mode="before")
    @classmethod
    def normalize_nullable_url(cls, value: object) -> object:
        return _normalize_nullable_url(value)


class JobUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    company_name: str | None = Field(default=None, min_length=1, max_length=150)
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=100_000)
    job_url: HttpUrl | None = None
    location: str | None = Field(default=None, max_length=200)
    work_arrangement: WorkArrangement | None = None
    employment_type: EmploymentType | None = None

    @model_validator(mode="after")
    def reject_empty_update(self) -> "JobUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one field must be supplied.")
        return self

    @field_validator("company_name", mode="before")
    @classmethod
    def normalize_required_company_name(cls, value: object) -> object:
        return _normalize_company_display_name(_reject_null(value))

    @field_validator("title", mode="before")
    @classmethod
    def normalize_required_title(cls, value: object) -> object:
        return _trim_text(_reject_null(value))

    @field_validator("description", "location", mode="before")
    @classmethod
    def normalize_nullable_text(cls, value: object) -> object:
        return _normalize_nullable_text(value)

    @field_validator("job_url", mode="before")
    @classmethod
    def normalize_nullable_url(cls, value: object) -> object:
        return _normalize_nullable_url(value)

    @field_validator("work_arrangement", "employment_type", mode="before")
    @classmethod
    def reject_null_enum(cls, value: object) -> object:
        return _reject_null(value)


class CompanyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str


class JobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company: CompanyRead
    title: str
    job_url: HttpUrl | None
    location: str | None
    work_arrangement: WorkArrangement
    employment_type: EmploymentType
    description: str | None
    created_at: datetime
    updated_at: datetime


class JobListResponse(BaseModel):
    items: list[JobRead]
