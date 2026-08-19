"""Add provenance, suppression, and extraction eligibility.

Revision ID: 20260818_0004
Revises: 20260818_0003
Create Date: 2026-08-18
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260818_0004"
down_revision: str | None = "20260818_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Extraction policy is reviewed product data. New terms remain manual-only unless a later
# migration explicitly enables them.
EXTRACTABLE_NORMALIZED_TERMS = (
    ".net",
    "amazon web services",
    "aws",
    "c#",
    "c++",
    "cpp",
    "csharp",
    "docker",
    "fastapi",
    "git",
    "github actions",
    "java",
    "javascript",
    "kubernetes",
    "linux",
    "mongodb",
    "next.js",
    "nextjs",
    "node.js",
    "nodejs",
    "postgres",
    "postgresql",
    "psql",
    "python",
    "react",
    "react.js",
    "reactjs",
    "redis",
    "spring boot",
    "sql",
    "typescript",
    "vue",
    "vue.js",
    "vuejs",
)


def upgrade() -> None:
    op.add_column(
        "skill_terms",
        sa.Column("is_extractable", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.execute(
        sa.text("UPDATE skill_terms SET is_extractable = true WHERE normalized_term IN :terms")
        .bindparams(sa.bindparam("terms", expanding=True))
        .params(terms=EXTRACTABLE_NORMALIZED_TERMS)
    )
    op.alter_column("skill_terms", "is_extractable", server_default=None)

    op.add_column(
        "job_skills",
        sa.Column("is_manual", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "job_skills",
        sa.Column("is_detected", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_check_constraint(
        op.f("ck_job_skills_provenance_required"),
        "job_skills",
        "is_manual OR is_detected",
    )
    op.alter_column("job_skills", "is_manual", server_default=None)
    op.alter_column("job_skills", "is_detected", server_default=None)

    op.create_table(
        "job_skill_suppressions",
        sa.Column("job_id", sa.Uuid(), nullable=False),
        sa.Column("skill_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ("job_id", "user_id"),
            ("jobs.id", "jobs.user_id"),
            name="fk_job_skill_suppressions_job_id_user_id_jobs",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ("skill_id",),
            ("skills.id",),
            name=op.f("fk_job_skill_suppressions_skill_id_skills"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("job_id", "skill_id", name=op.f("pk_job_skill_suppressions")),
    )
    # PostgreSQL does not automatically index referencing FK columns. This mirrors job_skills and
    # keeps reverse skill deletion/lookups from requiring a full suppression-table scan.
    op.create_index(
        "ix_job_skill_suppressions_skill_id",
        "job_skill_suppressions",
        ("skill_id",),
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_job_skill_suppressions_skill_id", table_name="job_skill_suppressions")
    op.drop_table("job_skill_suppressions")
    op.drop_constraint(op.f("ck_job_skills_provenance_required"), "job_skills", type_="check")
    op.drop_column("job_skills", "is_detected")
    op.drop_column("job_skills", "is_manual")
    op.drop_column("skill_terms", "is_extractable")
