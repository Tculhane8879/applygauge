# ADR 004: Local Authentication Strategy

## Status

Accepted — Milestone 0; implementation deferred to Milestone 1

## Context

The specification selects Supabase Auth with email and password for v1. Milestone 0 must establish a
reliable foundation without beginning authentication, protected routes, or ownership behavior.
Adding a local Supabase Auth stack now would increase infrastructure before authentication tests and
requirements are in scope.

## Decision

Retain Supabase Auth as the planned v1 identity provider. Defer all authentication implementation,
credentials, token validation, protected routes, and local Auth infrastructure to Milestone 1.

Milestone 1 must explicitly document and test its local authentication workflow. FastAPI will
validate authenticated identity and derive ownership from that identity; it will not trust a
client-supplied `user_id`.

Milestone 0 environment files contain no required Supabase variables.

## Alternatives Considered

- Start the local Supabase stack in Milestone 0: rejected because it is not needed to verify the
  current frontend, API, and PostgreSQL foundation.
- Use hosted Supabase Auth exclusively during development: deferred for Milestone 1 evaluation
  because local reproducibility and test isolation must be considered.
- Implement custom password authentication: rejected because it contradicts the frozen v1 stack
  and creates unnecessary security responsibility.

## Consequences

- Milestone 0 remains small and has no partially implemented security behavior.
- Authentication-specific dependencies and configuration are added only with their tests and use
  cases.
- The exact local Supabase Auth workflow remains a deliberate Milestone 1 task, not hidden technical
  debt in the foundation.
