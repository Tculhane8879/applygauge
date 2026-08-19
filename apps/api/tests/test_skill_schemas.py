from uuid import uuid4

import pytest
from pydantic import ValidationError

from applygauge_api.skills.schemas import (
    SkillAdd,
    SkillCategory,
    SkillListResponse,
    SkillRead,
    SkillSource,
)


@pytest.mark.parametrize("name", ["PostgreSQL", "Postgres", "C++", "NodeJS"])
def test_skill_add_accepts_canonical_and_alias_shaped_names(name: str) -> None:
    assert SkillAdd.model_validate({"name": name}).name == name


def test_skill_add_cleans_unicode_and_whitespace() -> None:
    assert SkillAdd.model_validate({"name": "  ＰｏｓｔｇｒｅＳＱＬ  "}).name == "PostgreSQL"
    assert SkillAdd.model_validate({"name": "Amazon   Web Services"}).name == (
        "Amazon Web Services"
    )


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"name": None},
        {"name": ""},
        {"name": "   "},
        {"name": "x" * 101},
        {"name": "Node\x00js"},
        {"name": "Node\u200bjs"},
        {"name": "Python", "user_id": str(uuid4())},
        {"name": "Python", "skill_id": str(uuid4())},
        {"name": "Python", "category": "LANGUAGE"},
        {"name": "Python", "source": "MANUAL"},
    ],
)
def test_skill_add_rejects_invalid_or_extra_input(payload: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        SkillAdd.model_validate(payload)


def test_skill_read_exposes_only_canonical_public_fields() -> None:
    skill_id = uuid4()
    response = SkillRead.model_validate(
        {
            "id": skill_id,
            "name": "PostgreSQL",
            "category": "DATABASE",
            "sources": ["MANUAL", "DETECTED"],
            "normalized_term": "postgresql",
            "user_id": uuid4(),
        }
    )
    assert response.model_dump(mode="json") == {
        "id": str(skill_id),
        "name": "PostgreSQL",
        "category": "DATABASE",
        "sources": ["MANUAL", "DETECTED"],
    }


def test_skill_list_response_serializes_focused_items() -> None:
    skill = SkillRead(
        id=uuid4(),
        name="Python",
        category=SkillCategory.LANGUAGE,
        sources=[SkillSource.DETECTED],
    )
    assert SkillListResponse(items=[skill]).model_dump(mode="json") == {
        "items": [
            {
                "id": str(skill.id),
                "name": "Python",
                "category": "LANGUAGE",
                "sources": ["DETECTED"],
            }
        ]
    }
