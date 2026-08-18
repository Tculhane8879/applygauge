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
        CheckConstraint(
            "work_arrangement IN ('UNKNOWN', 'REMOTE', 'HYBRID', 'ONSITE')",
            name="work_arrangement_allowed",
        ),
        CheckConstraint(
            "employment_type IN ('UNKNOWN', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP')",
            name="employment_type_allowed",
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
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    company: Mapped[Company] = relationship(back_populates="jobs")
