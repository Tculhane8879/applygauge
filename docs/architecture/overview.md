# ApplyGauge Architecture Overview

## Status and scope

This document describes the v1 direction and the foundation implemented through Milestone 1.
Authentication is implemented; product/domain capabilities begin in later milestones.

## System boundary

```text
Next.js / React / TypeScript
             |
             | HTTP/JSON
             v
       FastAPI / Python
             |
             | SQLAlchemy / SQL
             v
          PostgreSQL
```

### Next.js

The frontend owns presentation, accessible browser interaction, client-side UI state, and UI-level
validation. It calls the versioned FastAPI surface for application operations. It does not directly
read or write domain tables through Supabase-generated database APIs.

### FastAPI

FastAPI is the application boundary and owns authenticated identity validation. It will also own
domain logic, authorization and ownership enforcement, input validation beyond UI concerns, status
transitions, deterministic skill extraction, notes, and analytics as their milestones arrive.

The backend is a modular monolith: one deployable API organized into cohesive modules. ApplyGauge
does not need microservices, a message broker, or a worker during v1.

### PostgreSQL

PostgreSQL owns persistent relational data. SQLAlchemy provides application database access and
Alembic will own schema migrations after product schema work begins. Milestone 0 intentionally has
no domain entities, product tables, or migration revisions.

The persistence layer remains ordinary PostgreSQL-compatible. A future free deployment may use
Supabase-hosted PostgreSQL, but core behavior must not depend unnecessarily on proprietary Supabase
database abstractions.

## Supabase boundary

Supabase Auth is the v1 identity provider. Next.js uses cookie-backed SSR sessions with distinct
browser, server, and Proxy clients. Proxy and protected Server Components use verified claims for
route decisions. FastAPI independently validates tokens through JWKS and derives a typed identity
before protected operations. The browser is not trusted to supply resource ownership.

Supabase infrastructure does not replace FastAPI as the business-logic boundary.

## Local development architecture

The primary inner development loop is:

```text
Next.js dev server             local host, port 3000
FastAPI via uv                 local host, port 8000
PostgreSQL via Docker Compose  container, exposed on port 5432
Supabase Auth stack            containers, API exposed on port 55021
```

Running source processes locally provides fast reloads, direct debugger access, and simple editor
integration. Docker Compose supplies a consistent PostgreSQL version without requiring a host
database installation. Full frontend/backend containerization is secondary and is not required for
the primary workflow or current acceptance criteria.

Environment boundaries are explicit:

- root `.env` configures the local PostgreSQL Compose service;
- `apps/api/.env` contains private backend configuration;
- `apps/web/.env.local` contains browser-visible frontend configuration.

Supabase's Auth-owned database is separate from the ApplyGauge application database. See the
[local authentication guide](../authentication/local-development.md) for the service map.

## Liveness and readiness

The foundation exposes two unauthenticated operational endpoints beneath `/api/v1`:

- `GET /api/v1/health` is a liveness check. It confirms that FastAPI can serve a request and does
  not query external infrastructure.
- `GET /api/v1/health/ready` is a readiness check. It executes `SELECT 1` through SQLAlchemy and
  returns HTTP 503 when PostgreSQL cannot be reached.

This distinction allows process monitoring to tell an unhealthy API process apart from a live API
that is temporarily unable to serve database-backed application requests.

## Current request flow

The public landing page calls the liveness endpoint. Authenticated users establish a cookie-backed
Supabase session, and the protected dashboard forwards its access token to
`GET /api/v1/auth/me`. FastAPI independently validates the token before returning identity. The
readiness endpoint separately verifies the API-to-application-database connection.

## Future evolution, not yet implemented

- Later milestones add owned product resources behind the established authenticated identity.
- Later v1 milestones add job management, application history, deterministic skill extraction, and
  explainable analytics inside the FastAPI modular monolith.
- Post-v1 releases may add a browser extension, resume intelligence, semantic retrieval, background
  processing, and applied AI only when their product requirements justify them.

Redis, workers, pgvector, AI services, Kubernetes, and billable cloud infrastructure are not part of
the current architecture.
