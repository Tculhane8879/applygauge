from fastapi.testclient import TestClient

from applygauge_api.main import app


def test_openapi_exposes_only_authenticated_analytics_reads() -> None:
    document = TestClient(app).get("/openapi.json").json()
    paths = document["paths"]
    overview = paths["/api/v1/analytics/overview"]
    skills = paths["/api/v1/analytics/skills"]

    assert set(overview) == {"get"}
    assert set(skills) == {"get"}
    assert overview["get"]["security"] == [{"HTTPBearer": []}]
    assert skills["get"]["security"] == [{"HTTPBearer": []}]
    assert "parameters" not in overview["get"]
    assert "parameters" not in skills["get"]
    assert all(
        not path.startswith("/api/v1/analytics/")
        or path
        in {
            "/api/v1/analytics/overview",
            "/api/v1/analytics/skills",
        }
        for path in paths
    )

    schemas = document["components"]["schemas"]
    assert set(schemas["AnalyticsOverviewRead"]["required"]) == {
        "total_jobs",
        "applied_jobs",
        "interview_jobs",
        "response_rate_percentage",
        "top_skills",
        "recent_jobs",
    }
    assert schemas["AnalyticsOverviewRead"]["properties"]["response_rate_percentage"]["anyOf"]
    assert set(schemas["SkillDemandRead"]["required"]) == {
        "id",
        "name",
        "category",
        "job_count",
        "job_percentage",
    }
    assert "user_id" not in schemas["SkillDemandRead"]["properties"]
    assert "minimum_job_count" not in document["components"].get("parameters", {})


def test_analytics_requires_authentication() -> None:
    client = TestClient(app)
    assert client.get("/api/v1/analytics/overview").status_code == 401
    assert client.get("/api/v1/analytics/skills").status_code == 401
