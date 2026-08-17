from functools import lru_cache
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from applygauge_api.auth.models import AuthenticatedUser
from applygauge_api.auth.policy import AuthenticationPolicy
from applygauge_api.auth.verifier import AuthenticationError, JwtVerifier
from applygauge_api.core.config import get_settings

bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache
def get_jwt_verifier() -> JwtVerifier:
    return JwtVerifier(AuthenticationPolicy.from_settings(get_settings()))


def unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    verifier: Annotated[JwtVerifier, Depends(get_jwt_verifier)],
) -> AuthenticatedUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise unauthorized()
    try:
        return verifier.verify(credentials.credentials)
    except AuthenticationError as exc:
        raise unauthorized() from exc
