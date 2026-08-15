import os

import pytest
from fastapi.testclient import TestClient

from applygauge_api.main import app

pytestmark = pytest.mark.integration


@pytest.mark.skipif(
    os.getenv("RUN_DATABASE_INTEGRATION") != "1",
    reason="Set RUN_DATABASE_INTEGRATION=1 to run against PostgreSQL.",
)
def test_readiness_endpoint_reaches_postgresql() -> None:
    response = TestClient(app).get("/api/v1/health/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ready"}
