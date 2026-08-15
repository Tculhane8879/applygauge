from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["development", "test", "production"] = "development"
    database_url: str = "postgresql+psycopg://applygauge:applygauge_local@localhost:5432/applygauge"
    cors_origins: list[AnyHttpUrl] = [AnyHttpUrl("http://localhost:3000")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
