from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKeyConstraint,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from applygauge_api.db.base import Base
from applygauge_api.jobs.statuses import APPLICATION_STATUSES

WORK_ARRANGEMENTS = ("UNKNOWN", "REMOTE", "HYBRID", "ONSITE")
EMPLOYMENT_TYPES = ("UNKNOWN", "FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP")


class Company(Base):
    __tablename__ = "companies"
    __table_args__ = (
        UniqueConstraint("user_id", "normalized_name", name="uq_companies_user_id_normalized_name"),
        UniqueConstraint("id", "user_id", name="uq_companies_id_user_id"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(150), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    jobs: Mapped[list["Job"]] = relationship(back_populates="company")


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        ForeignKeyConstraint(
            ("company_id", "user_id"),
            ("companies.id", "companies.user_id"),
            name="fk_jobs_company_id_user_id_companies",
            ondelete="RESTRICT",
        ),
        UniqueConstraint("id", "user_id", name="uq_jobs_id_user_id"),
        CheckConstraint(
            "work_arrangement IN ('UNKNOWN', 'REMOTE', 'HYBRID', 'ONSITE')",
            name="work_arrangement_allowed",
        ),
        CheckConstraint(
            "employment_type IN ('UNKNOWN', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP')",
            name="employment_type_allowed",
        ),
        CheckConstraint(
            f"current_status IN {APPLICATION_STATUSES!r}",
            name="current_status_allowed",
        ),
        Index(
            "ix_jobs_user_id_created_at_id",
            "user_id",
            text("created_at DESC"),
            text("id DESC"),
        ),
        Index("ix_jobs_user_id_company_id", "user_id", "company_id"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(nullable=False)
    company_id: Mapped[UUID] = mapped_column(nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    job_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    work_arrangement: Mapped[str] = mapped_column(
        String(16), nullable=False, default="UNKNOWN", server_default="UNKNOWN"
    )
    employment_type: Mapped[str] = mapped_column(
        String(16), nullable=False, default="UNKNOWN", server_default="UNKNOWN"
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    current_status: Mapped[str] = mapped_column(String(16), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    company: Mapped[Company] = relationship(back_populates="jobs")
    status_events: Mapped[list["StatusEvent"]] = relationship(
        back_populates="job", passive_deletes=True
    )


class StatusEvent(Base):
    __tablename__ = "status_events"
    __table_args__ = (
        ForeignKeyConstraint(
            ("job_id", "user_id"),
            ("jobs.id", "jobs.user_id"),
            name="fk_status_events_job_id_user_id_jobs",
            ondelete="CASCADE",
        ),
        CheckConstraint(
            f"from_status IS NULL OR from_status IN {APPLICATION_STATUSES!r}",
            name="from_status_allowed",
        ),
        CheckConstraint(
            f"to_status IN {APPLICATION_STATUSES!r}",
            name="to_status_allowed",
        ),
        CheckConstraint(
            "from_status IS NULL OR from_status <> to_status",
            name="status_change_required",
        ),
        Index(
            "ix_status_events_user_id_job_id_changed_at_id",
            "user_id",
            "job_id",
            "changed_at",
            "id",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(nullable=False)
    job_id: Mapped[UUID] = mapped_column(nullable=False)
    from_status: Mapped[str | None] = mapped_column(String(16), nullable=True)
    to_status: Mapped[str] = mapped_column(String(16), nullable=False)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.clock_timestamp()
    )
    job: Mapped[Job] = relationship(back_populates="status_events")
