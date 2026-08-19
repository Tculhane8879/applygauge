# ApplyGauge Architecture Overview

## Status and scope

This document describes the v1 direction and architecture implemented through Milestone 4B.
Authentication, user-owned job management, the application pipeline, canonical skills,
deterministic extraction, manual correction, and provenance display are implemented. Milestone 4B
is pending developer manual acceptance.

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

Saved-job, status-transition, and job-skill writes use authenticated Next.js Server Actions. Each action re-establishes the server-side
Supabase session, obtains its access token through the shared token-provider boundary, and calls
FastAPI through the centralized API transport. FastAPI remains authoritative for validation,
ownership, company resolution, and persistence. Successful actions revalidate affected routes and
redirect to the persisted resource or list.

### FastAPI

FastAPI is the application boundary and owns authenticated identity validation, domain logic,
authorization and ownership enforcement, input validation beyond UI concerns, status transitions,
and deterministic skill extraction. Notes and analytics remain for later milestones.

The backend is a modular monolith: one deployable API organized into cohesive modules. ApplyGauge
does not need microservices, a message broker, or a worker during v1.

### PostgreSQL

PostgreSQL owns persistent relational data. SQLAlchemy provides application database access and
Alembic owns schema migrations. Milestone 2 introduced user-owned `companies` and `jobs` tables in
the separate ApplyGauge application database. Milestone 3 adds a checked current-status snapshot
and immutable same-owner transition events. FastAPI updates both atomically while holding an
ownership-scoped PostgreSQL row lock. Milestone 4A adds a global curated `skills` vocabulary, a
unified exact-lookup `skill_terms` namespace, and private same-owner `job_skills` associations.
Milestone 4B adds explicit extraction eligibility, manual/detected association provenance, and
private durable suppressions. Existing-job skill mutations serialize on the owned `jobs` row;
new-job extraction remains inside the already-owned creation transaction.

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
readiness endpoint separately verifies the API-to-application-database connection. Authenticated
Saved Jobs list and detail Server Components obtain the current Supabase access token through one
server-only provider and call FastAPI through the centralized authenticated transport. FastAPI
scopes the resulting domain queries to the token's user UUID before reading PostgreSQL. Lists and
details show current status; detail pages read chronological immutable history and canonical skills
and use focused Server Actions for status and skill changes. Successful changes refresh
server-authoritative job, history, and skill data. Aliases are resolved only by FastAPI; the
frontend neither canonicalizes terms nor mutates the global catalog.

Job creation and changed descriptions synchronously run the pure deterministic extractor inside
the job transaction. FastAPI reconciles canonical associations against private suppressions and
returns ordered `MANUAL`/`DETECTED` domain sources. The frontend renders readable provenance but
does not scan descriptions, infer sources, or retain correction state.

## Future evolution, not yet implemented

- Later v1 work adds search, filtering, notes, and explainable analytics inside the FastAPI
  modular monolith.
- Post-v1 releases may add a browser extension, resume intelligence, semantic retrieval, background
  processing, and applied AI only when their product requirements justify them.

Redis, workers, pgvector, AI services, Kubernetes, and billable cloud infrastructure are not part of
the current architecture.
