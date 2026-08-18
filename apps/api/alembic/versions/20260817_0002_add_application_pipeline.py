"""Add application pipeline persistence.

Revision ID: 20260817_0002
Revises: 20260817_0001
Create Date: 2026-08-17
"""

from collections.abc import Sequence
from uuid import UUID, uuid4

import sqlalchemy as sa

from alembic import op

revision: str = "20260817_0002"
down_revision: str | None = "20260817_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

STATUSES = (
    "SAVED",
    "APPLIED",
    "SCREENING",
    "INTERVIEW",
    "OFFER",
    "REJECTED",
    "WITHDRAWN",
)
BATCH_SIZE = 500


def upgrade() -> None:
    op.add_column("jobs", sa.Column("current_status", sa.String(length=16), nullable=True))
    op.execute(sa.text("UPDATE jobs SET current_status = 'SAVED'"))
    op.alter_column("jobs", "current_status", existing_type=sa.String(length=16), nullable=False)
    op.create_check_constraint(
        op.f("ck_jobs_current_status_allowed"),
        "jobs",
        f"current_status IN {STATUSES!r}",
    )
    op.create_unique_constraint("uq_jobs_id_user_id", "jobs", ("id", "user_id"))

    op.create_table(
        "status_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("job_id", sa.Uuid(), nullable=False),
        sa.Column("from_status", sa.String(length=16), nullable=True),
        sa.Column("to_status", sa.String(length=16), nullable=False),
        sa.Column(
            "changed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("clock_timestamp()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            f"from_status IS NULL OR from_status IN {STATUSES!r}",
            name=op.f("ck_status_events_from_status_allowed"),
        ),
        sa.CheckConstraint(
            "from_status IS NULL OR from_status <> to_status",
            name=op.f("ck_status_events_status_change_required"),
        ),
        sa.CheckConstraint(
            f"to_status IN {STATUSES!r}",
            name=op.f("ck_status_events_to_status_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ("job_id", "user_id"),
            ("jobs.id", "jobs.user_id"),
            name="fk_status_events_job_id_user_id_jobs",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_status_events"),
    )

    _backfill_initial_events()
    op.create_index(
        "ix_status_events_user_id_job_id_changed_at_id",
        "status_events",
        ("user_id", "job_id", "changed_at", "id"),
        unique=False,
    )


def _backfill_initial_events() -> None:
    connection = op.get_bind()
    jobs = sa.table(
        "jobs",
        sa.column("id", sa.Uuid()),
        sa.column("user_id", sa.Uuid()),
        sa.column("created_at", sa.DateTime(timezone=True)),
    )
    status_events = sa.table(
        "status_events",
        sa.column("id", sa.Uuid()),
        sa.column("user_id", sa.Uuid()),
        sa.column("job_id", sa.Uuid()),
        sa.column("from_status", sa.String(length=16)),
        sa.column("to_status", sa.String(length=16)),
        sa.column("changed_at", sa.DateTime(timezone=True)),
    )
    last_id: UUID | None = None
    while True:
        statement = sa.select(jobs.c.id, jobs.c.user_id, jobs.c.created_at).order_by(jobs.c.id)
        if last_id is not None:
            statement = statement.where(jobs.c.id > last_id)
        rows = connection.execute(statement.limit(BATCH_SIZE)).all()
        if not rows:
            break
        connection.execute(
            status_events.insert(),
            [
                {
                    "id": uuid4(),
                    "user_id": row.user_id,
                    "job_id": row.id,
                    "from_status": None,
                    "to_status": "SAVED",
                    "changed_at": row.created_at,
                }
                for row in rows
            ],
        )
        last_id = rows[-1].id


def downgrade() -> None:
    op.drop_index("ix_status_events_user_id_job_id_changed_at_id", table_name="status_events")
    op.drop_table("status_events")
    op.drop_constraint("uq_jobs_id_user_id", "jobs", type_="unique")
    op.drop_constraint(op.f("ck_jobs_current_status_allowed"), "jobs", type_="check")
    op.drop_column("jobs", "current_status")
