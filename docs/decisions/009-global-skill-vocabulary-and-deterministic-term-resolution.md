# ADR 009: Global Skill Vocabulary and Deterministic Term Resolution

## Status

Accepted — Milestone 4A

## Context

ApplyGauge needs structured skill identities that can later support deterministic extraction,
job-demand aggregation, and resume skill-gap comparison. Technology vocabulary semantics are
global, while associations between skills and jobs are private user-domain data. Milestone 4A must
support predictable manual resolution without prematurely deciding extraction or provenance.

## Decision

### Global curated vocabulary

Canonical `Skill` rows are global and shared. JavaScript, PostgreSQL, and other technologies have
one stable identity for every user, avoiding per-user normalization drift and supporting future
aggregation. Ordinary users cannot create, rename, recategorize, or delete skills, or create
aliases. Unknown terms return a safe validation error instead of creating catalog rows, preventing
typo and catalog pollution.

### Unified term namespace

Canonical names and aliases share `skill_terms`. Every accepted lookup token has one globally
unique `normalized_term`, enforced by `UNIQUE(normalized_term)`. A partial unique index on
`skill_id` where `is_canonical` is true permits at most one canonical term per skill. Seed and
integrity tests ensure every skill has exactly one canonical term because ordinary APIs cannot
mutate the catalog. Separate canonical and alias uniqueness namespaces were rejected because the
same normalized token could then resolve ambiguously.

### Normalization is not aliasing

Normalization applies Unicode NFKC, trims outer whitespace, collapses internal whitespace, applies
case folding, preserves punctuation, rejects blank/control/format input, and enforces a
100-character limit. It does not create semantic equivalence: `C`, `C++`, and `C#` remain distinct.
`Node.js` and `NodeJS` normalize differently and resolve together only because both are explicit
catalog terms.

### Curated migration-backed catalog

The seed is bounded product data, not an exhaustive taxonomy. Catalog changes occur through
reviewed migrations. Canonical skills use fixed UUIDs; term UUIDs are deterministically derived
from normalized values. The migration requires no PostgreSQL UUID extension and contains its own
normalization and seed data so historical upgrades do not depend on mutable runtime modules.

### Private job associations

`job_skills` stores `job_id`, `skill_id`, `user_id`, and `created_at`. Ownership comes only from the
authenticated identity, never request input. The composite foreign key `(job_id, user_id) ->
jobs(id, user_id)` provides same-owner defense in depth.

### Idempotent association operations

The first add returns `201 Created`; an existing association returns `200 OK`. Both return canonical
`SkillRead`. Removing an existing or already-absent association returns `204 No Content`.
Idempotency makes retries safe and prevents stale clients from turning an achieved state into an
error.

### No catalog mutation API

Application code reads `skills` and `skill_terms` but mutates only `job_skills`. There is no global
catalog endpoint or ordinary-user catalog mutation path.

### Deferred provenance and extraction

Milestone 4A adds no source field, `MANUAL`/`DETECTED` provenance, confidence, or extraction state.
Milestone 4B will design provenance, correction, description-update, re-extraction, and
false-positive semantics together. This ADR does not decide those mechanics.
Those deferred mechanics are subsequently decided in
[ADR 010](010-deterministic-skill-extraction-and-manual-correction.md).

## Alternatives Considered

- Per-user catalogs: rejected because duplicate identities undermine normalization and aggregation.
- Arbitrary user-created skills: rejected because typo handling, merging, and governance are unresolved.
- Separate canonical and alias namespaces: rejected because they permit ambiguous normalized tokens.
- Punctuation-stripping normalization: rejected because it collapses `C`, `C++`, and `C#`.
- Random seed identifiers: rejected because cross-environment and downgrade/re-upgrade identity
  would not be deterministic.
- Extraction or provenance in 4A: rejected because correction and re-extraction must be designed
  together in 4B.

## Consequences

- Legitimate missing technologies require a reviewed catalog migration.
- Catalog mistakes affect all users and therefore need review.
- The unified terms add a join but guarantee unambiguous resolution.
- Ordinary users cannot add arbitrary niche technologies yet.
- Future extraction must distinguish manual-safe aliases from prose-safe terms.
- A later provenance/source migration will be additive.
- The category taxonomy is currently fixed by the project specification.
