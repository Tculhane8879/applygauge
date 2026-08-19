from uuid import UUID

import pytest

from applygauge_api.skills.extraction import ExtractionTerm, extract_skill_ids

PYTHON = UUID("00000000-0000-0000-0000-000000000001")
POSTGRESQL = UUID("00000000-0000-0000-0000-000000000002")
JAVA = UUID("00000000-0000-0000-0000-000000000003")
JAVASCRIPT = UUID("00000000-0000-0000-0000-000000000004")
REACT = UUID("00000000-0000-0000-0000-000000000005")
NODE = UUID("00000000-0000-0000-0000-000000000006")
NEXT = UUID("00000000-0000-0000-0000-000000000007")
VUE = UUID("00000000-0000-0000-0000-000000000008")
CPP = UUID("00000000-0000-0000-0000-000000000009")
CSHARP = UUID("00000000-0000-0000-0000-00000000000a")
DOTNET = UUID("00000000-0000-0000-0000-00000000000b")
SQL = UUID("00000000-0000-0000-0000-00000000000c")
GIT = UUID("00000000-0000-0000-0000-00000000000d")
GITHUB_ACTIONS = UUID("00000000-0000-0000-0000-00000000000e")
SPRING_BOOT = UUID("00000000-0000-0000-0000-00000000000f")
AWS = UUID("00000000-0000-0000-0000-000000000010")


def term(skill_id: UUID, value: str) -> ExtractionTerm:
    return ExtractionTerm(skill_id=skill_id, normalized_term=value.casefold())


@pytest.mark.parametrize("description", [None, "", " \n\t "])
def test_empty_descriptions_have_no_matches(description: str | None) -> None:
    assert extract_skill_ids(description, [term(PYTHON, "python")]) == ()


def test_casefold_nfkc_punctuation_and_multiple_skills() -> None:
    terms = [
        term(PYTHON, "python"),
        term(POSTGRESQL, "postgres"),
        term(CPP, "c++"),
        term(CSHARP, "c#"),
        term(DOTNET, ".net"),
        term(SQL, "sql"),
    ]
    description = "ＰＹＴＨＯＮ, POSTGRES, C++, C#, .NET, and SQL."
    assert extract_skill_ids(description, terms) == tuple(
        sorted((PYTHON, POSTGRESQL, CPP, CSHARP, DOTNET, SQL), key=lambda value: value.int)
    )


def test_approved_aliases_and_flexible_multiword_whitespace() -> None:
    terms = [
        term(POSTGRESQL, "postgresql"),
        term(POSTGRESQL, "postgres"),
        term(POSTGRESQL, "psql"),
        term(REACT, "react.js"),
        term(REACT, "reactjs"),
        term(NODE, "node.js"),
        term(NODE, "nodejs"),
        term(NEXT, "next.js"),
        term(NEXT, "nextjs"),
        term(VUE, "vue.js"),
        term(VUE, "vue"),
        term(VUE, "vuejs"),
        term(SPRING_BOOT, "spring boot"),
        term(AWS, "amazon web services"),
        term(CPP, "cpp"),
        term(CSHARP, "csharp"),
    ]
    description = (
        "PostgreSQL postgres psql React.js ReactJS Node.js NodeJS NextJS VueJS "
        "Spring\n  Boot Amazon Web Services cpp csharp"
    )
    expected = (POSTGRESQL, REACT, NODE, NEXT, VUE, SPRING_BOOT, AWS, CPP, CSHARP)
    assert extract_skill_ids(description, terms) == tuple(
        sorted(expected, key=lambda value: value.int)
    )


def test_longer_overlapping_terms_win_and_repetitions_deduplicate() -> None:
    terms = [
        term(JAVA, "java"),
        term(JAVASCRIPT, "javascript"),
        term(REACT, "react"),
        term(REACT, "react.js"),
        term(GIT, "git"),
        term(GITHUB_ACTIONS, "github actions"),
    ]
    result = extract_skill_ids("JavaScript React.js React react GitHub Actions git git", terms)
    assert result == tuple(
        sorted((JAVASCRIPT, REACT, GIT, GITHUB_ACTIONS), key=lambda value: value.int)
    )


@pytest.mark.parametrize(
    ("description", "literal"),
    [
        ("JavaScript", "java"),
        ("reactive", "react"),
        ("NoSQL", "sql"),
        ("NodeJSExtra", "nodejs"),
        ("C++17", "c++"),
        ("C+++", "c++"),
        ("C#Something", "c#"),
    ],
)
def test_embedded_or_extended_tokens_are_rejected(description: str, literal: str) -> None:
    assert extract_skill_ids(description, [term(PYTHON, literal)]) == ()


def test_manual_only_terms_are_absent_when_not_supplied_as_extraction_terms() -> None:
    extraction_terms = [term(JAVASCRIPT, "javascript"), term(NODE, "node.js")]
    assert extract_skill_ids("C JS TS Node", extraction_terms) == ()


def test_deterministic_result_order_does_not_depend_on_term_order() -> None:
    first = [term(POSTGRESQL, "postgres"), term(PYTHON, "python")]
    second = list(reversed(first))
    assert (
        extract_skill_ids("Python and Postgres", first)
        == extract_skill_ids("Python and Postgres", second)
        == (PYTHON, POSTGRESQL)
    )


def test_empty_catalog_literal_is_rejected() -> None:
    with pytest.raises(ValueError, match="non-empty"):
        extract_skill_ids("Python", [ExtractionTerm(skill_id=PYTHON, normalized_term="")])
