from collections.abc import Callable
from typing import Any

import jwt
from jwt import PyJWK, PyJWKClient
from jwt.exceptions import InvalidTokenError, PyJWKClientError
from pydantic import ValidationError

from applygauge_api.auth.models import AuthenticatedUser, TokenClaims
from applygauge_api.auth.policy import AuthenticationPolicy


class AuthenticationError(Exception):
    """An access token could not establish an authenticated ApplyGauge identity."""


class JwtVerifier:
    def __init__(
        self,
        policy: AuthenticationPolicy,
        signing_key_resolver: Callable[[str], PyJWK] | None = None,
    ) -> None:
        self._policy = policy
        if signing_key_resolver is None:
            jwks_client = PyJWKClient(
                policy.jwks_url,
                cache_keys=True,
                cache_jwk_set=True,
                lifespan=policy.jwks_cache_lifespan_seconds,
            )
            signing_key_resolver = jwks_client.get_signing_key_from_jwt
        self._signing_key_resolver = signing_key_resolver

    def verify(self, token: str) -> AuthenticatedUser:
        try:
            signing_key = self._signing_key_resolver(token)
            payload: dict[str, Any] = jwt.decode(
                token,
                signing_key.key,
                algorithms=list(self._policy.allowed_algorithms),
                audience=self._policy.audience,
                issuer=self._policy.issuer,
                leeway=self._policy.clock_skew_seconds,
                options={"require": list(self._policy.required_claims)},
            )
            claims = TokenClaims.model_validate(payload)
        except (InvalidTokenError, PyJWKClientError, ValidationError, ValueError) as exc:
            raise AuthenticationError from exc

        return AuthenticatedUser(
            id=claims.sub,
            email=claims.email,
            session_id=claims.session_id,
        )
