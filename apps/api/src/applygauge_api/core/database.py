from typing import cast

from sqlalchemy import Engine, create_engine, text

from applygauge_api.core.config import get_settings


def create_database_engine() -> Engine:
    return create_engine(get_settings().database_url, pool_pre_ping=True)


def database_is_ready(engine: Engine) -> bool:
    with engine.connect() as connection:
        result = cast(int, connection.execute(text("SELECT 1")).scalar_one())
        return result == 1
