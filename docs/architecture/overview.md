# ApplyGauge Architecture Overview

## Status and scope

This document describes the v1 architectural direction and the infrastructure implemented in
Milestone 0. Product and authentication capabilities described as future work are not currently
implemented.

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

FastAPI is the application boundary and will own domain business logic, authenticated identity
validation, authorization and ownership enforcement, input validation beyond UI concerns, status
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

Supabase Auth is the specified v1 identity provider. Authentication begins in Milestone 1, so no
Supabase client, credentials, local Auth stack, or token validation exists in Milestone 0. When
implemented, Supabase will establish identity and FastAPI will validate that identity before
performing protected operations. The browser will not be trusted to supply resource ownership.

Supabase infrastructure does not replace FastAPI as the business-logic boundary.

## Local development architecture

The primary inner development loop is:

```text
Next.js dev server             local host, port 3000
FastAPI via uv                 local host, port 8000
PostgreSQL via Docker Compose  container, exposed on port 5432
```

Running source processes locally provides fast reloads, direct debugger access, and simple editor
integration. Docker Compose supplies a consistent PostgreSQL version without requiring a host
database installation. Full frontend/backend containerization is secondary and is not required for
the primary workflow or current acceptance criteria.

Environment boundaries are explicit:

- root `.env` configures the local PostgreSQL Compose service;
- `apps/api/.env` contains private backend configuration;
- `apps/web/.env.local` contains browser-visible frontend configuration.

## Liveness and readiness

The foundation exposes two unauthenticated operational endpoints beneath `/api/v1`:

- `GET /api/v1/health` is a liveness check. It confirms that FastAPI can serve a request and does
  not query external infrastructure.
- `GET /api/v1/health/ready` is a readiness check. It executes `SELECT 1` through SQLAlchemy and
  returns HTTP 503 when PostgreSQL cannot be reached.

This distinction allows process monitoring to tell an unhealthy API process apart from a live API
that is temporarily unable to serve database-backed application requests.

## Current request flow

At Milestone 0, the frontend calls only the liveness endpoint and displays `checking`, `connected`,
or `unavailable`. The readiness endpoint verifies the API-to-database connection. Together they
exercise the local path from Next.js through FastAPI to PostgreSQL without inventing product data.

## Future evolution, not yet implemented

- Milestone 1 adds Supabase Auth integration and the ownership foundation.
- Later v1 milestones add job management, application history, deterministic skill extraction, and
  explainable analytics inside the FastAPI modular monolith.
- Post-v1 releases may add a browser extension, resume intelligence, semantic retrieval, background
  processing, and applied AI only when their product requirements justify them.

Redis, workers, pgvector, AI services, Kubernetes, and billable cloud infrastructure are not part of
the current architecture.
