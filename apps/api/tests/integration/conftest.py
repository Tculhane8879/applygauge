import os
from collections.abc import Iterator
from pathlib import Path
from uuid import uuid4

import pytest
from alembic.config import Config
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from alembic import command
from applygauge_api.core.config import get_settings


@pytest.fixture(scope="session")
def migrated_database_url() -> Iterator[str]:
    if os.getenv("RUN_DATABASE_INTEGRATION") != "1":
        pytest.skip("Set RUN_DATABASE_INTEGRATION=1 to run against PostgreSQL.")

    configured_url = make_url(get_settings().database_url)
    if configured_url.get_backend_name() != "postgresql":
        pytest.fail("Database integration tests require PostgreSQL.")

    database_name = f"applygauge_test_{uuid4().hex}"
    admin_engine = create_engine(
        configured_url.set(database="postgres"), isolation_level="AUTOCOMMIT"
    )
    test_database_url = configured_url.set(database=database_name)

    with admin_engine.connect() as connection:
        connection.exec_driver_sql(f'CREATE DATABASE "{database_name}"')

    try:
        config = make_alembic_config(test_database_url.render_as_string(hide_password=False))
        command.upgrade(config, "head")
        yield test_database_url.render_as_string(hide_password=False)
    finally:
        with admin_engine.connect() as connection:
            connection.execute(
                text(
                    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                    "WHERE datname = :database_name AND pid <> pg_backend_pid()"
                ),
                {"database_name": database_name},
            )
            connection.exec_driver_sql(f'DROP DATABASE IF EXISTS "{database_name}"')
        admin_engine.dispose()


def make_alembic_config(database_url: str) -> Config:
    api_root = Path(__file__).parents[2]
    config = Config(api_root / "alembic.ini")
    config.attributes["database_url"] = database_url
    return config


@pytest.fixture(scope="session")
def migrated_engine(migrated_database_url: str) -> Iterator[Engine]:
    engine = create_engine(migrated_database_url)
    try:
        yield engine
    finally:
        engine.dispose()


@pytest.fixture
def database_session(migrated_engine: Engine) -> Iterator[Session]:
    with migrated_engine.connect() as connection:
        transaction = connection.begin()
        with Session(
            bind=connection,
            expire_on_commit=False,
            join_transaction_mode="create_savepoint",
        ) as session:
            yield session
        transaction.rollback()
