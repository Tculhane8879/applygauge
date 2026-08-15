# ADR 005: Docker Development Strategy

## Status

Accepted — Milestone 0

## Context

ApplyGauge needs a reproducible local environment. Containerizing every source process can provide a
single command, but it also adds build, volume, file-watching, and debugging complexity to the main
development loop.

## Decision

Use the following primary development loop:

- Next.js runs directly on the host through the root npm workspace.
- FastAPI runs directly on the host through the uv-managed project environment.
- PostgreSQL runs in Docker Compose.

Docker provides reproducible infrastructure without obscuring normal frontend and backend debugging.
Full application images and an optional full-app Compose profile are secondary and may be added when
they provide concrete value. They are not required to complete the current foundation.

## Alternatives Considered

- Run all services in Compose from the beginning: rejected because container build and development
  volume complexity would delay the core feedback loop.
- Run all services directly on the host: rejected because requiring a host PostgreSQL installation
  reduces database reproducibility.
- Depend on a hosted development database: rejected because local development must remain free and
  independently runnable.

## Consequences

- Frontend and backend hot reload and debugger attachment remain straightforward.
- Docker is required only for PostgreSQL in the normal workflow.
- Startup currently uses three explicit processes rather than one full-stack command.
- Future container images must preserve this local workflow rather than replacing it without a
  demonstrated need.
