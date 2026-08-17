# Authentication API

## `GET /api/v1/auth/me`

Returns the identity established from a valid Supabase user access token supplied as
`Authorization: Bearer <access-token>`.

```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "email": "person@example.test",
  "session_id": "22222222-2222-4222-8222-222222222222"
}
```

FastAPI resolves the signing key through Supabase JWKS and accepts only the centralized ES256
policy. It validates issuer, audience, expiration, issued-at time, authenticated role,
non-anonymous status, email, user UUID, and session UUID. Missing or invalid credentials receive a
generic HTTP 401 with `WWW-Authenticate: Bearer`. Liveness and readiness remain public.

Next.js obtains the raw access token only when forwarding an authenticated request and adds the
bearer header through a centralized authenticated API layer. Sign-out clears the browser session,
but an already issued ES256 token remains offline-verifiable until expiration; FastAPI does not
perform a remote revocation check on every request.
