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

    assert {"companies", "jobs", "status_events", "skills", "skill_terms", "job_skills"}.issubset(
        inspector.get_table_names()
    )

    config = make_alembic_config(migrated_database_url)
    expected_head = ScriptDirectory.from_config(config).get_current_head()
    with migrated_engine.connect() as connection:
        current_revision = MigrationContext.configure(connection).get_current_revision()

    assert current_revision == expected_head == "20260818_0003"

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


def test_skills_migration_seeds_catalog_and_preserves_existing_domain(
    disposable_database_url: str,
) -> None:
    config = make_alembic_config(disposable_database_url)
    command.upgrade(config, "20260817_0002")
    company_id, job_id, event_id, user_id = uuid4(), uuid4(), uuid4(), uuid4()
    engine = create_engine(disposable_database_url)
    with engine.begin() as connection:
        connection.execute(
            text(
                "INSERT INTO companies (id, user_id, name, normalized_name) "
                "VALUES (:id, :user_id, 'Existing Company', 'existing company')"
            ),
            {"id": company_id, "user_id": user_id},
        )
        connection.execute(
            text(
                "INSERT INTO jobs (id, user_id, company_id, title, current_status) "
                "VALUES (:id, :user_id, :company_id, 'Existing Job', 'SAVED')"
            ),
            {"id": job_id, "user_id": user_id, "company_id": company_id},
        )
        connection.execute(
            text(
                "INSERT INTO status_events "
                "(id, user_id, job_id, from_status, to_status) "
                "VALUES (:id, :user_id, :job_id, NULL, 'SAVED')"
            ),
            {"id": event_id, "user_id": user_id, "job_id": job_id},
        )
    engine.dispose()

    command.upgrade(config, "20260818_0003")
    command.check(config)
    engine = create_engine(disposable_database_url)
    inspector = inspect(engine)
    assert {"skills", "skill_terms", "job_skills"}.issubset(inspector.get_table_names())
    assert {
        constraint["name"] for constraint in inspector.get_unique_constraints("skill_terms")
    } == {"uq_skill_terms_normalized_term"}
    assert "uq_skill_terms_skill_id_canonical" in {
        index["name"] for index in inspector.get_indexes("skill_terms")
    }
    assert "ix_job_skills_skill_id" in {
        index["name"] for index in inspector.get_indexes("job_skills")
    }
    with engine.connect() as connection:
        assert connection.scalar(text("SELECT count(*) FROM skills")) == 24
        assert connection.scalar(text("SELECT count(*) FROM skill_terms")) == 38
        assert connection.scalar(text("SELECT count(*) FROM job_skills")) == 0
        assert (
            connection.scalar(
                text(
                    "SELECT s.name FROM skill_terms t JOIN skills s ON s.id = t.skill_id "
                    "WHERE t.normalized_term = 'postgres'"
                )
            )
            == "PostgreSQL"
        )
        assert (
            connection.scalar(
                text("SELECT current_status FROM jobs WHERE id = :id"), {"id": job_id}
            )
            == "SAVED"
        )
        assert (
            connection.scalar(
                text("SELECT to_status FROM status_events WHERE id = :id"), {"id": event_id}
            )
            == "SAVED"
        )
    engine.dispose()

    command.downgrade(config, "20260817_0002")
    engine = create_engine(disposable_database_url)
    inspector = inspect(engine)
    assert not {"skills", "skill_terms", "job_skills"}.intersection(inspector.get_table_names())
    with engine.connect() as connection:
        assert (
            connection.scalar(text("SELECT name FROM companies WHERE id = :id"), {"id": company_id})
            == "Existing Company"
        )
        assert (
            connection.scalar(text("SELECT title FROM jobs WHERE id = :id"), {"id": job_id})
            == "Existing Job"
        )
        assert (
            connection.scalar(
                text("SELECT to_status FROM status_events WHERE id = :id"), {"id": event_id}
            )
            == "SAVED"
        )
    engine.dispose()

    command.upgrade(config, "head")
    command.check(config)
    engine = create_engine(disposable_database_url)
    with engine.connect() as connection:
        assert connection.scalar(text("SELECT count(*) FROM skills")) == 24
        assert connection.scalar(text("SELECT count(*) FROM skill_terms")) == 38
    engine.dispose()


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
