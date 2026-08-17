from dataclasses import dataclass

from applygauge_api.core.config import Settings

ALLOWED_JWT_ALGORITHMS = ("ES256",)
REQUIRED_JWT_CLAIMS = (
    "iss",
    "aud",
    "exp",
    "iat",
    "sub",
    "role",
    "session_id",
    "is_anonymous",
    "email",
)


@dataclass(frozen=True)
class AuthenticationPolicy:
    issuer: str
    audience: str
    jwks_url: str
    allowed_algorithms: tuple[str, ...] = ALLOWED_JWT_ALGORITHMS
    required_claims: tuple[str, ...] = REQUIRED_JWT_CLAIMS
    clock_skew_seconds: int = 30
    jwks_cache_lifespan_seconds: int = 300

    @classmethod
    def from_settings(cls, settings: Settings) -> "AuthenticationPolicy":
        base_url = str(settings.supabase_url).rstrip("/")
        issuer = f"{base_url}/auth/v1"
        return cls(
            issuer=issuer,
            audience=settings.supabase_jwt_audience,
            jwks_url=f"{issuer}/.well-known/jwks.json",
        )
