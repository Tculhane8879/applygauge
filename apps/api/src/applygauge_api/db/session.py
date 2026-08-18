from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine
from sqlalchemy.orm import Session, sessionmaker

from applygauge_api.core.database import create_database_engine


@lru_cache
def get_database_engine() -> Engine:
    return create_database_engine()


@lru_cache
def get_session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=get_database_engine(), expire_on_commit=False)


def get_db_session() -> Iterator[Session]:
    with get_session_factory()() as session:
        yield session
