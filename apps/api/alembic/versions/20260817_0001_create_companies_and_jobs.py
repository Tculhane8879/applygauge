"""Create companies and jobs.

Revision ID: 20260817_0001
Revises:
Create Date: 2026-08-17
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260817_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("normalized_name", sa.String(length=150), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_companies"),
        sa.UniqueConstraint("id", "user_id", name="uq_companies_id_user_id"),
        sa.UniqueConstraint(
            "user_id", "normalized_name", name="uq_companies_user_id_normalized_name"
        ),
    )
    op.create_table(
        "jobs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("job_url", sa.Text(), nullable=True),
        sa.Column("location", sa.String(length=200), nullable=True),
        sa.Column(
            "work_arrangement", sa.String(length=16), server_default="UNKNOWN", nullable=False
        ),
        sa.Column(
            "employment_type", sa.String(length=16), server_default="UNKNOWN", nullable=False
        ),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "employment_type IN ('UNKNOWN', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP')",
            name=op.f("ck_jobs_employment_type_allowed"),
        ),
        sa.CheckConstraint(
            "work_arrangement IN ('UNKNOWN', 'REMOTE', 'HYBRID', 'ONSITE')",
            name=op.f("ck_jobs_work_arrangement_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ("company_id", "user_id"),
            ("companies.id", "companies.user_id"),
            name="fk_jobs_company_id_user_id_companies",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_jobs"),
    )
    op.create_index("ix_jobs_user_id_company_id", "jobs", ("user_id", "company_id"), unique=False)
    op.create_index(
        "ix_jobs_user_id_created_at_id",
        "jobs",
        ("user_id", sa.text("created_at DESC"), sa.text("id DESC")),
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_jobs_user_id_created_at_id", table_name="jobs")
    op.drop_index("ix_jobs_user_id_company_id", table_name="jobs")
    op.drop_table("jobs")
    op.drop_table("companies")
