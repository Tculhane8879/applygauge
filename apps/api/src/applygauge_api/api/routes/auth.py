from typing import Annotated

from fastapi import APIRouter, Depends

from applygauge_api.auth.dependencies import get_current_user
from applygauge_api.auth.models import AuthenticatedUser

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.get("/me", response_model=AuthenticatedUser)
def current_user(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> AuthenticatedUser:
    return user
