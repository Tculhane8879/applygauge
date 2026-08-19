from datetime import UTC, datetime
from uuid import UUID

import pytest

from applygauge_api.analytics.schemas import AnalyticsOverviewRead, RecentJobRead, SkillDemandRead
from applygauge_api.analytics.service import percentage
from applygauge_api.jobs.statuses import ApplicationStatus
from applygauge_api.skills.schemas import SkillCategory


@pytest.mark.parametrize(
    ("numerator", "denominator", "expected"),
    [
        (1, 3, 33.3),
        (2, 3, 66.7),
        (1, 6, 16.7),
        (1, 16, 6.3),
        (1, 8, 12.5),
        (3, 8, 37.5),
        (4, 4, 100.0),
    ],
)
def test_percentage_uses_one_decimal_half_up_rounding(
    numerator: int, denominator: int, expected: float
) -> None:
    assert percentage(numerator, denominator) == expected


def test_analytics_schemas_serialize_narrow_numeric_contract() -> None:
    skill = SkillDemandRead(
        id=UUID("11111111-1111-4111-8111-111111111111"),
        name="Python",
        category=SkillCategory.LANGUAGE,
        job_count=1,
        job_percentage=33.3,
    )
    recent = RecentJobRead(
        id=UUID("22222222-2222-4222-8222-222222222222"),
        company_name="Example",
        title="Engineer",
        current_status=ApplicationStatus.SAVED,
        created_at=datetime(2026, 1, 1, tzinfo=UTC),
    )
    payload = AnalyticsOverviewRead(
        total_jobs=3,
        applied_jobs=0,
        interview_jobs=0,
        response_rate_percentage=None,
        top_skills=[skill],
        recent_jobs=[recent],
    ).model_dump(mode="json")

    assert payload["top_skills"][0]["job_percentage"] == 33.3
    assert payload["recent_jobs"][0]["created_at"] == "2026-01-01T00:00:00Z"
    assert "user_id" not in payload["top_skills"][0]
    assert "updated_at" not in payload["recent_jobs"][0]
