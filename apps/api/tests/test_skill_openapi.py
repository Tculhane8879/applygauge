from fastapi.testclient import TestClient

from applygauge_api.main import app


def test_openapi_exposes_only_nested_job_skill_operations() -> None:
    document = TestClient(app).get("/openapi.json").json()
    paths = document["paths"]
    collection = paths["/api/v1/jobs/{job_id}/skills"]
    member = paths["/api/v1/jobs/{job_id}/skills/{skill_id}"]

    assert set(collection) == {"get", "post"}
    assert set(member) == {"delete"}
    assert collection["get"]["security"] == [{"HTTPBearer": []}]
    assert collection["get"]["responses"].keys() >= {"200", "404", "422"}
    assert collection["post"]["security"] == [{"HTTPBearer": []}]
    assert collection["post"]["responses"].keys() >= {"200", "201", "404", "422"}
    assert "requestBody" in collection["post"]
    assert member["delete"]["security"] == [{"HTTPBearer": []}]
    assert member["delete"]["responses"].keys() >= {"204", "404", "422"}
    assert "/api/v1/skills" not in paths

    schemas = document["components"]["schemas"]
    assert schemas["SkillAdd"]["required"] == ["name"]
    assert schemas["SkillAdd"]["additionalProperties"] is False
    assert set(schemas["SkillRead"]["required"]) == {"id", "name", "category", "sources"}
    assert schemas["SkillSource"]["enum"] == ["MANUAL", "DETECTED"]
    assert set(schemas["SkillListResponse"]["required"]) == {"items"}
