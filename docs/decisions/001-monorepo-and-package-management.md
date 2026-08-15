# ADR 001: Monorepo and Package Management

## Status

Accepted — Milestone 0

## Context

ApplyGauge has a Next.js frontend and FastAPI backend that evolve together but use different
language ecosystems. The repository needs reproducible dependency installation without creating
empty abstractions or multiple unrelated repositories.

## Decision

Use one monorepo with applications under `apps/`. Manage JavaScript dependencies with npm
workspaces and one root `package-lock.json`. Manage the backend with `uv`,
`apps/api/pyproject.toml`, and a committed `apps/api/uv.lock`.

Do not create `packages/shared` until code is genuinely shared across applications. Use each
ecosystem's native configuration and lockfile rather than introducing a language-agnostic monorepo
or task orchestration framework.

## Alternatives Considered

- Separate repositories: rejected because coordinated changes and portfolio review would become
  less convenient without providing a current isolation benefit.
- pnpm, Yarn, or a monorepo build orchestrator: rejected because npm workspaces satisfy the current
  Node requirements with less tooling.
- pip requirements files or Poetry: rejected because uv provides fast, locked, pyproject-native
  dependency management and virtual environments.
- An empty shared package: rejected because no shared code exists yet.

## Consequences

- One clone contains the complete system and documentation.
- `npm ci` and `uv sync --frozen` reproduce locked environments.
- Node and Python commands remain separate and understandable.
- Cross-language task orchestration stays manual through clear root scripts and CI jobs.
- A shared package may be added later only after a concrete consumer and ownership boundary exist.
