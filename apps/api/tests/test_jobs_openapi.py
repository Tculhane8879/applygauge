from fastapi.testclient import TestClient

from applygauge_api.main import app


def test_jobs_openapi_exposes_only_increment_two_operations() -> None:
    paths = TestClient(app).get("/openapi.json").json()["paths"]

    assert set(paths["/api/v1/jobs"]) == {"get", "post"}
    assert set(paths["/api/v1/jobs/{job_id}"]) == {"get", "patch", "delete"}
    assert paths["/api/v1/jobs"]["post"]["responses"].keys() >= {"201", "422"}
    assert paths["/api/v1/jobs/{job_id}"]["get"]["responses"].keys() >= {
        "200",
        "404",
        "422",
    }
    assert paths["/api/v1/jobs"]["get"]["security"] == [{"HTTPBearer": []}]
    assert "requestBody" in paths["/api/v1/jobs/{job_id}"]["patch"]
    assert paths["/api/v1/jobs/{job_id}"]["patch"]["security"] == [{"HTTPBearer": []}]
    assert "204" in paths["/api/v1/jobs/{job_id}"]["delete"]["responses"]
    assert paths["/api/v1/jobs/{job_id}"]["delete"]["security"] == [{"HTTPBearer": []}]
