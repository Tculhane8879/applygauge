from typing import Any

import pytest

from applygauge_api.skills.normalization import InvalidSkillTermError, normalize_skill_term


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("  PostgreSQL  ", "postgresql"),
        ("Amazon   Web   Services", "amazon web services"),
        ("POSTGRESQL", "postgresql"),
        ("Ｐｙｔｈｏｎ", "python"),
        ("C", "c"),
        ("C++", "c++"),
        ("C#", "c#"),
        (".NET", ".net"),
        ("Node.js", "node.js"),
        ("Next.js", "next.js"),
    ],
)
def test_normalize_skill_term(value: str, expected: str) -> None:
    assert normalize_skill_term(value) == expected


def test_punctuation_sensitive_terms_remain_distinct() -> None:
    assert len({normalize_skill_term(value) for value in ("C", "C++", "C#")}) == 3
    assert normalize_skill_term("Node.js") != normalize_skill_term("NodeJS")


@pytest.mark.parametrize("value", ["", "   ", "\u2003"])
def test_normalize_skill_term_rejects_blank_values(value: str) -> None:
    with pytest.raises(InvalidSkillTermError, match="empty"):
        normalize_skill_term(value)


@pytest.mark.parametrize("value", ["Node\x00js", "Node\u200bjs"])
def test_normalize_skill_term_rejects_control_and_format_characters(value: str) -> None:
    with pytest.raises(InvalidSkillTermError, match="control or format"):
        normalize_skill_term(value)


def test_normalize_skill_term_rejects_overlong_cleaned_value() -> None:
    with pytest.raises(InvalidSkillTermError, match="100"):
        normalize_skill_term("x" * 101)


def test_normalize_skill_term_requires_a_string() -> None:
    value: Any = 42
    with pytest.raises(TypeError, match="strings"):
        normalize_skill_term(value)
