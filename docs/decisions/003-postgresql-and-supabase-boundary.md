# ADR 003: PostgreSQL and Supabase Boundary

## Status

Accepted — Milestone 0

## Context

ApplyGauge requires relational persistence, a fully local free workflow, and portability if free
hosting offerings change. Supabase may provide a free hosted PostgreSQL database later, but local
development cannot depend on a hosted service.

## Decision

Use ordinary PostgreSQL-compatible application persistence through SQLAlchemy. Run PostgreSQL 17
locally with Docker Compose. Use Alembic for schema changes once product schema work begins; no
product revisions exist in Milestone 0.

A future free public deployment may use Supabase-hosted PostgreSQL. Avoid unnecessary Supabase-only
database features and keep core persistence portable to another PostgreSQL host.

## Alternatives Considered

- Hosted Supabase for all development: rejected because local work would depend on an external
  free plan and network access.
- SQLite for development: rejected because behavior could differ from the required PostgreSQL
  production database.
- Installing PostgreSQL directly on every host: rejected because Compose gives a more reproducible
  and removable local dependency.
- Proprietary generated database APIs as the persistence boundary: rejected because FastAPI and
  SQLAlchemy own application access.

## Consequences

- Developers need Docker for the local database but not a host PostgreSQL installation.
- Local and hosted environments use the same database family.
- Moving between PostgreSQL providers should not require rewriting business logic.
- Provider-specific capabilities require explicit justification before adoption.
