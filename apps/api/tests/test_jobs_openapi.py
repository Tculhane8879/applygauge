from fastapi.testclient import TestClient

from applygauge_api.main import app


def test_jobs_openapi_exposes_pipeline_operations() -> None:
    paths = TestClient(app).get("/openapi.json").json()["paths"]

    assert set(paths["/api/v1/jobs"]) == {"get", "post"}
    assert set(paths["/api/v1/jobs/{job_id}"]) == {"get", "patch", "delete"}
    assert set(paths["/api/v1/jobs/{job_id}/status"]) == {"patch"}
    assert set(paths["/api/v1/jobs/{job_id}/status-events"]) == {"get"}
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
    status_patch = paths["/api/v1/jobs/{job_id}/status"]["patch"]
    assert status_patch["security"] == [{"HTTPBearer": []}]
    assert status_patch["responses"].keys() >= {"200", "404", "409", "422"}
    assert "requestBody" in status_patch
    history_get = paths["/api/v1/jobs/{job_id}/status-events"]["get"]
    assert history_get["security"] == [{"HTTPBearer": []}]
    assert history_get["responses"].keys() >= {"200", "404", "422"}

    schemas = TestClient(app).get("/openapi.json").json()["components"]["schemas"]
    assert schemas["StatusUpdate"]["additionalProperties"] is False
    assert schemas["StatusUpdate"]["required"] == ["status"]
    assert "current_status" in schemas["JobRead"]["required"]
