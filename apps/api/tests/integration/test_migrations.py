from uuid import uuid4

from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import Engine, create_engine, inspect, text

from alembic import command
from tests.integration.conftest import make_alembic_config

pytestmark = __import__("pytest").mark.integration


def test_migration_creates_domain_tables_at_head(
    migrated_engine: Engine, migrated_database_url: str
) -> None:
    inspector = inspect(migrated_engine)

    assert {"companies", "jobs", "status_events"}.issubset(inspector.get_table_names())

    config = make_alembic_config(migrated_database_url)
    expected_head = ScriptDirectory.from_config(config).get_current_head()
    with migrated_engine.connect() as connection:
        current_revision = MigrationContext.configure(connection).get_current_revision()

    assert current_revision == expected_head == "20260817_0002"

    current_status = next(
        column for column in inspector.get_columns("jobs") if column["name"] == "current_status"
    )
    assert current_status["nullable"] is False
    assert current_status["default"] is None


def test_migration_downgrades_and_reupgrades_disposable_database(
    migrated_engine: Engine, migrated_database_url: str
) -> None:
    config = make_alembic_config(migrated_database_url)
    migrated_engine.dispose()

    command.downgrade(config, "base")
    verification_engine = create_engine(migrated_database_url)
    try:
        assert "companies" not in inspect(verification_engine).get_table_names()
        assert "jobs" not in inspect(verification_engine).get_table_names()
    finally:
        verification_engine.dispose()

    command.upgrade(config, "head")
    command.check(config)


def test_pipeline_migration_backfills_and_round_trips_existing_data(
    disposable_database_url: str,
) -> None:
    config = make_alembic_config(disposable_database_url)
    command.upgrade(config, "20260817_0001")
    company_id, job_id, user_id = uuid4(), uuid4(), uuid4()
    engine = create_engine(disposable_database_url)
    with engine.begin() as connection:
        connection.execute(
            text(
                "INSERT INTO companies (id, user_id, name, normalized_name) "
                "VALUES (:id, :user_id, 'Acme', 'acme')"
            ),
            {"id": company_id, "user_id": user_id},
        )
        connection.execute(
            text(
                "INSERT INTO jobs (id, user_id, company_id, title) "
                "VALUES (:id, :user_id, :company_id, 'Engineer')"
            ),
            {"id": job_id, "user_id": user_id, "company_id": company_id},
        )
        created_at = connection.scalar(
            text("SELECT created_at FROM jobs WHERE id = :id"), {"id": job_id}
        )
    engine.dispose()

    command.upgrade(config, "head")
    command.check(config)
    engine = create_engine(disposable_database_url)
    with engine.connect() as connection:
        job = connection.execute(
            text("SELECT title, current_status FROM jobs WHERE id = :id"), {"id": job_id}
        ).one()
        event = connection.execute(
            text(
                "SELECT user_id, job_id, from_status, to_status, changed_at "
                "FROM status_events WHERE job_id = :id"
            ),
            {"id": job_id},
        ).one()
    engine.dispose()
    assert job == ("Engineer", "SAVED")
    assert event.user_id == user_id
    assert event.job_id == job_id
    assert event.from_status is None
    assert event.to_status == "SAVED"
    assert event.changed_at == created_at

    command.downgrade(config, "20260817_0001")
    engine = create_engine(disposable_database_url)
    inspector = inspect(engine)
    assert "status_events" not in inspector.get_table_names()
    assert "current_status" not in {column["name"] for column in inspector.get_columns("jobs")}
    with engine.connect() as connection:
        assert (
            connection.scalar(text("SELECT title FROM jobs WHERE id = :id"), {"id": job_id})
            == "Engineer"
        )
        assert (
            connection.scalar(text("SELECT name FROM companies WHERE id = :id"), {"id": company_id})
            == "Acme"
        )
    engine.dispose()
    command.upgrade(config, "head")
    command.check(config)
