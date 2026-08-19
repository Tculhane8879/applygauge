from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from applygauge_api.auth.dependencies import get_current_user
from applygauge_api.auth.models import AuthenticatedUser
from applygauge_api.db.session import get_db_session
from applygauge_api.jobs.service import JobNotFoundError
from applygauge_api.skills.schemas import SkillAdd, SkillListResponse, SkillRead
from applygauge_api.skills.service import (
    SkillNotAvailableError,
    add_job_skill,
    list_job_skills,
    remove_job_skill,
)

router = APIRouter(prefix="/jobs/{job_id}/skills", tags=["job skills"])


def _job_not_found(exc: JobNotFoundError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="The requested job could not be found.",
    )


@router.get(
    "",
    response_model=SkillListResponse,
    responses={status.HTTP_404_NOT_FOUND: {"description": "Job not found"}},
)
def get_job_skills(
    job_id: UUID,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> SkillListResponse:
    try:
        return SkillListResponse(
            items=[
                SkillRead.model_validate(skill)
                for skill in list_job_skills(session, current_user.id, job_id)
            ]
        )
    except JobNotFoundError as exc:
        raise _job_not_found(exc) from exc


@router.post(
    "",
    response_model=SkillRead,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_200_OK: {"description": "Skill was already associated"},
        status.HTTP_404_NOT_FOUND: {"description": "Job not found"},
        status.HTTP_422_UNPROCESSABLE_CONTENT: {"description": "Invalid or unavailable skill"},
    },
)
def post_job_skill(
    job_id: UUID,
    payload: SkillAdd,
    response: Response,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> SkillRead:
    try:
        result = add_job_skill(session, current_user.id, job_id, payload)
    except JobNotFoundError as exc:
        raise _job_not_found(exc) from exc
    except SkillNotAvailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="That skill is not available in the catalog.",
        ) from exc
    response.status_code = status.HTTP_201_CREATED if result.created else status.HTTP_200_OK
    return SkillRead.model_validate(result.skill)


@router.delete(
    "/{skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={status.HTTP_404_NOT_FOUND: {"description": "Job not found"}},
)
def delete_job_skill(
    job_id: UUID,
    skill_id: UUID,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> Response:
    try:
        remove_job_skill(session, current_user.id, job_id, skill_id)
    except JobNotFoundError as exc:
        raise _job_not_found(exc) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
