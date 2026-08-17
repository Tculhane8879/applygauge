# ADR 006: Supabase Authentication Boundary

## Status

Accepted — Milestone 1

## Context

ApplyGauge needs email/password identity, confirmation, persistent browser sessions, protected UI,
and independently secured FastAPI requests while remaining locally reproducible at no cost.

## Decision

Supabase Auth is the v1 identity provider. Next.js App Router uses `@supabase/ssr` cookie-backed
sessions with separate browser, server, and Proxy clients. Proxy refreshes cookies and uses verified
claims for route UX; protected Server Components verify claims again. Raw sessions are read only
when an access token must be forwarded to FastAPI.

FastAPI independently validates tokens against Supabase JWKS using the centralized ES256 policy.
Email/password signup requires email confirmation through the token-hash `verifyOtp` SSR flow.
Sign-out clears the local session through a POST route. The Supabase Auth-owned database remains
separate from the portable ApplyGauge application PostgreSQL database.

Local development uses the Supabase CLI stack. A future free public deployment may use hosted
Supabase Auth without moving application business logic out of FastAPI. Windows port substitutions
and disabled optional local services are environment details recorded in the local authentication
guide, not product architecture.

## Alternatives Considered

- Deprecated Supabase Auth Helpers: rejected for the supported `@supabase/ssr` package.
- Custom token storage: rejected because it duplicates session handling.
- Trusting cookies or `getSession()` for authorization: rejected; verified claims protect UI routes
  and FastAPI verifies access tokens independently.
- Direct domain CRUD through Supabase: rejected because it bypasses FastAPI.

## Consequences

- Sessions persist across navigation and reload through cookies and refresh-token rotation.
- FastAPI remains usable by future bearer-token clients without the browser client.
- Sign-out cannot revoke an already issued offline-verifiable token immediately; FastAPI may accept
  it until expiration unless future requirements justify a revocation check.
- Authenticated cookie-bearing routes must not be publicly cached.
- Local signing material remains ignored and never enters frontend configuration.
