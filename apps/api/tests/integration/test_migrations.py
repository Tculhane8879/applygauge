from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import Engine, create_engine, inspect

from alembic import command
from tests.integration.conftest import make_alembic_config

pytestmark = __import__("pytest").mark.integration


def test_migration_creates_domain_tables_at_head(
    migrated_engine: Engine, migrated_database_url: str
) -> None:
    inspector = inspect(migrated_engine)

    assert {"companies", "jobs"}.issubset(inspector.get_table_names())

    config = make_alembic_config(migrated_database_url)
    expected_head = ScriptDirectory.from_config(config).get_current_head()
    with migrated_engine.connect() as connection:
        current_revision = MigrationContext.configure(connection).get_current_revision()

    assert current_revision == expected_head == "20260817_0001"


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
