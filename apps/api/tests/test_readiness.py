from collections.abc import Iterator
from unittest.mock import MagicMock

from fastapi.testclient import TestClient
from sqlalchemy import Engine

from applygauge_api.core.database import create_database_engine
from applygauge_api.main import app


def test_readiness_endpoint_reports_ready() -> None:
    engine = MagicMock(spec=Engine)
    scalar_one = engine.connect.return_value.__enter__.return_value.execute.return_value.scalar_one
    scalar_one.return_value = 1

    def override_engine() -> Iterator[Engine]:
        yield engine

    app.dependency_overrides[create_database_engine] = override_engine
    try:
        response = TestClient(app).get("/api/v1/health/ready")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"status": "ready"}
