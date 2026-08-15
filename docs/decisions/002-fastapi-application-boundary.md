# ADR 002: FastAPI as the Application Boundary

## Status

Accepted — Milestone 0

## Context

Supabase can provide generated database APIs in addition to authentication and hosted PostgreSQL.
Allowing the frontend to perform normal domain operations through those APIs would split business
rules and authorization across clients, FastAPI, and provider-specific configuration.

## Decision

FastAPI is the API and business-logic boundary. The frontend communicates with FastAPI for normal
application-domain operations. Future validation, ownership enforcement, status transitions, skill
extraction, notes, and analytics belong behind this boundary.

The frontend must not bypass FastAPI to perform domain CRUD through Supabase-generated database
APIs. Supabase Auth may establish identity, but FastAPI will validate that identity and authorize
operations.

## Alternatives Considered

- Direct frontend access to Supabase database APIs: rejected because it fragments domain logic and
  increases provider coupling.
- Next.js-only backend behavior: rejected because the frozen stack deliberately uses Python and
  FastAPI for backend business logic.
- Microservices: rejected because v1 requirements fit a modular monolith.

## Consequences

- Business rules have one primary implementation and test boundary.
- Future browser-extension clients can reuse the same API.
- Authorization cannot depend on frontend visibility or client-supplied ownership.
- FastAPI is an additional deployable process, but that complexity is intentional and required by
  the project architecture.
