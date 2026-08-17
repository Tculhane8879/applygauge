from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient
from jwt import PyJWK
from jwt.exceptions import PyJWKClientError

from applygauge_api.auth.dependencies import get_jwt_verifier
from applygauge_api.auth.policy import AuthenticationPolicy
from applygauge_api.auth.verifier import AuthenticationError, JwtVerifier
from applygauge_api.main import app

ISSUER = "http://auth.example.test/auth/v1"
AUDIENCE = "authenticated"
KEY_ID = "test-key"
USER_ID = UUID("11111111-1111-4111-8111-111111111111")
SESSION_ID = UUID("22222222-2222-4222-8222-222222222222")


@pytest.fixture
def private_key() -> ec.EllipticCurvePrivateKey:
    return ec.generate_private_key(ec.SECP256R1())


def public_jwk(private_key: ec.EllipticCurvePrivateKey, key_id: str = KEY_ID) -> PyJWK:
    numbers = private_key.public_key().public_numbers()

    def encoded(value: int) -> str:
        return jwt.utils.base64url_encode(value.to_bytes(32, "big")).decode()

    return PyJWK.from_dict(
        {
            "kty": "EC",
            "crv": "P-256",
            "alg": "ES256",
            "use": "sig",
            "kid": key_id,
            "x": encoded(numbers.x),
            "y": encoded(numbers.y),
        }
    )


def policy() -> AuthenticationPolicy:
    return AuthenticationPolicy(
        issuer=ISSUER,
        audience=AUDIENCE,
        jwks_url=f"{ISSUER}/.well-known/jwks.json",
        clock_skew_seconds=0,
    )


def claims(**overrides: Any) -> dict[str, Any]:
    now = datetime.now(UTC)
    result: dict[str, Any] = {
        "iss": ISSUER,
        "aud": AUDIENCE,
        "exp": now + timedelta(minutes=5),
        "iat": now,
        "sub": str(USER_ID),
        "role": "authenticated",
        "session_id": str(SESSION_ID),
        "is_anonymous": False,
        "email": "person@example.test",
    }
    result.update(overrides)
    return result


def encode_token(
    private_key: ec.EllipticCurvePrivateKey,
    payload: dict[str, Any] | None = None,
) -> str:
    return jwt.encode(
        payload or claims(),
        private_key,
        algorithm="ES256",
        headers={"kid": KEY_ID},
    )


def verifier_for(private_key: ec.EllipticCurvePrivateKey) -> JwtVerifier:
    signing_key = public_jwk(private_key)
    return JwtVerifier(policy(), signing_key_resolver=lambda _token: signing_key)


def test_valid_token_establishes_authenticated_user(
    private_key: ec.EllipticCurvePrivateKey,
) -> None:
    user = verifier_for(private_key).verify(encode_token(private_key))

    assert user.id == USER_ID
    assert user.session_id == SESSION_ID
    assert user.email == "person@example.test"


@pytest.mark.parametrize(
    ("claim", "value"),
    [
        ("iss", "http://wrong.example.test/auth/v1"),
        ("aud", "wrong"),
        ("sub", "not-a-uuid"),
        ("session_id", "not-a-uuid"),
        ("role", "anon"),
        ("is_anonymous", True),
        ("email", ""),
    ],
)
def test_rejects_invalid_identity_claims(
    private_key: ec.EllipticCurvePrivateKey,
    claim: str,
    value: object,
) -> None:
    token = encode_token(private_key, claims(**{claim: value}))

    with pytest.raises(AuthenticationError):
        verifier_for(private_key).verify(token)


@pytest.mark.parametrize(
    "missing_claim",
    ["iss", "aud", "exp", "iat", "sub", "role", "session_id", "is_anonymous", "email"],
)
def test_rejects_missing_required_claim(
    private_key: ec.EllipticCurvePrivateKey,
    missing_claim: str,
) -> None:
    payload = claims()
    del payload[missing_claim]

    with pytest.raises(AuthenticationError):
        verifier_for(private_key).verify(encode_token(private_key, payload))


def test_rejects_expired_token(private_key: ec.EllipticCurvePrivateKey) -> None:
    token = encode_token(private_key, claims(exp=datetime.now(UTC) - timedelta(seconds=1)))

    with pytest.raises(AuthenticationError):
        verifier_for(private_key).verify(token)


def test_rejects_invalid_signature(private_key: ec.EllipticCurvePrivateKey) -> None:
    other_key = ec.generate_private_key(ec.SECP256R1())

    with pytest.raises(AuthenticationError):
        verifier_for(private_key).verify(encode_token(other_key))


def test_rejects_unknown_signing_key(private_key: ec.EllipticCurvePrivateKey) -> None:
    def unknown_key(_token: str) -> PyJWK:
        raise PyJWKClientError("Unable to find a signing key that matches the token kid")

    verifier = JwtVerifier(policy(), signing_key_resolver=unknown_key)

    with pytest.raises(AuthenticationError):
        verifier.verify(encode_token(private_key))


def test_auth_me_requires_bearer_token() -> None:
    response = TestClient(app).get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json() == {"detail": "Authentication required."}
    assert response.headers["www-authenticate"] == "Bearer"


def test_auth_me_returns_authenticated_identity(
    private_key: ec.EllipticCurvePrivateKey,
) -> None:
    verifier = verifier_for(private_key)
    app.dependency_overrides[get_jwt_verifier] = lambda: verifier
    try:
        response = TestClient(app).get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {encode_token(private_key)}"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "id": str(USER_ID),
        "email": "person@example.test",
        "session_id": str(SESSION_ID),
    }


def test_health_endpoints_remain_public() -> None:
    response = TestClient(app).get("/api/v1/health")

    assert response.status_code == 200
