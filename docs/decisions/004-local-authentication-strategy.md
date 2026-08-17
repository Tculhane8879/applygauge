# ADR 004: Local Authentication Strategy

## Status

Accepted — Milestone 1

## Context

The specification selects Supabase Auth with email and password for v1. Development needs
reproducible signup, confirmation-email inspection, token issuance, and key discovery without paid
infrastructure. FastAPI must remain the application boundary and must not trust client-supplied
ownership.

## Decision

Use Supabase Auth as the v1 identity provider. Local development runs the Auth-owned database,
API/Auth gateway, and email-capture service through Supabase CLI. Analytics and Studio are disabled
because ApplyGauge does not use them for authentication development.

FastAPI validates ES256 access tokens through Supabase JWKS and derives authenticated identity from
validated claims. Local private signing material remains ignored and is never application
configuration. Local Windows port substitutions are tooling compatibility details documented in
the authentication development guide, not product architecture.

## Alternatives Considered

- Use hosted Supabase Auth exclusively: rejected for the primary loop because it reduces local
  reproducibility and requires external infrastructure.
- Implement custom password authentication: rejected because it contradicts the frozen v1 stack
  and creates unnecessary security responsibility.
- Run every optional Supabase service: rejected because Analytics and Studio add no Milestone 1
  capability.

## Consequences

- Developers can test signup, confirmation email, JWKS, and ES256 tokens locally.
- The Auth-owned database is distinct from ApplyGauge's application database.
- FastAPI remains portable and depends on standard JWT/JWKS behavior rather than Supabase database
  APIs.
- Frontend authentication uses the local Auth services documented by this decision.
