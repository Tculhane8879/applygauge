from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from applygauge_api.auth.dependencies import get_current_user
from applygauge_api.auth.models import AuthenticatedUser
from applygauge_api.db.session import get_db_session
from applygauge_api.jobs.schemas import (
    JobCreate,
    JobListResponse,
    JobRead,
    JobUpdate,
    StatusEventListResponse,
    StatusEventRead,
    StatusUpdate,
)
from applygauge_api.jobs.service import (
    JobNotFoundError,
    StatusNoOpError,
    create_job,
    delete_job,
    get_owned_job,
    list_owned_jobs,
    list_status_events,
    transition_job_status,
    update_job,
)

router = APIRouter(prefix="/jobs", tags=["jobs"])


def job_not_found(exc: JobNotFoundError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="The requested job could not be found.",
    )


@router.post("", response_model=JobRead, status_code=status.HTTP_201_CREATED)
def post_job(
    payload: JobCreate,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> JobRead:
    return JobRead.model_validate(create_job(session, current_user, payload))


@router.get("", response_model=JobListResponse)
def get_jobs(
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> JobListResponse:
    return JobListResponse(
        items=[JobRead.model_validate(job) for job in list_owned_jobs(session, current_user.id)]
    )


@router.get(
    "/{job_id}",
    response_model=JobRead,
    responses={status.HTTP_404_NOT_FOUND: {"description": "Job not found"}},
)
def get_job(
    job_id: UUID,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> JobRead:
    try:
        return JobRead.model_validate(get_owned_job(session, current_user.id, job_id))
    except JobNotFoundError as exc:
        raise job_not_found(exc) from exc


@router.patch(
    "/{job_id}",
    response_model=JobRead,
    responses={status.HTTP_404_NOT_FOUND: {"description": "Job not found"}},
)
def patch_job(
    job_id: UUID,
    payload: JobUpdate,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> JobRead:
    try:
        return JobRead.model_validate(update_job(session, current_user, job_id, payload))
    except JobNotFoundError as exc:
        raise job_not_found(exc) from exc


@router.patch(
    "/{job_id}/status",
    response_model=JobRead,
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Job not found"},
        status.HTTP_409_CONFLICT: {"description": "Job already has the requested status"},
    },
)
def patch_job_status(
    job_id: UUID,
    payload: StatusUpdate,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> JobRead:
    try:
        return JobRead.model_validate(transition_job_status(session, current_user, job_id, payload))
    except JobNotFoundError as exc:
        raise job_not_found(exc) from exc
    except StatusNoOpError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The job already has the requested status.",
        ) from exc


@router.get(
    "/{job_id}/status-events",
    response_model=StatusEventListResponse,
    responses={status.HTTP_404_NOT_FOUND: {"description": "Job not found"}},
)
def get_job_status_events(
    job_id: UUID,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> StatusEventListResponse:
    try:
        return StatusEventListResponse(
            items=[
                StatusEventRead.model_validate(event)
                for event in list_status_events(session, current_user.id, job_id)
            ]
        )
    except JobNotFoundError as exc:
        raise job_not_found(exc) from exc


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={status.HTTP_404_NOT_FOUND: {"description": "Job not found"}},
)
def remove_job(
    job_id: UUID,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> Response:
    try:
        delete_job(session, current_user.id, job_id)
    except JobNotFoundError as exc:
        raise job_not_found(exc) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
