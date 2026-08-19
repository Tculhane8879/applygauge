from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from applygauge_api.analytics.schemas import AnalyticsOverviewRead, SkillInsightsResponse
from applygauge_api.analytics.service import get_overview, get_skill_insights
from applygauge_api.auth.dependencies import get_current_user
from applygauge_api.auth.models import AuthenticatedUser
from applygauge_api.db.session import get_db_session

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", response_model=AnalyticsOverviewRead)
def analytics_overview(
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> AnalyticsOverviewRead:
    return get_overview(session, current_user.id)


@router.get("/skills", response_model=SkillInsightsResponse)
def skill_insights(
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> SkillInsightsResponse:
    return get_skill_insights(session, current_user.id)
