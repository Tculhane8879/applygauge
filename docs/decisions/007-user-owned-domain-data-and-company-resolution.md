# ADR 007: User-Owned Domain Data and Company Resolution

## Status

Accepted — Milestone 2

## Context

ApplyGauge requires application-domain data ownership while identity remains provided by Supabase
Auth. The portable ApplyGauge application PostgreSQL database and the Supabase Auth-owned
PostgreSQL database are intentionally separate. Job management also needs predictable company reuse
without prematurely creating a global company identity system.

## Decision

Store the authenticated Supabase user UUID directly in domain rows as `user_id`. Do not create an
ApplyGauge application user or profile table until a real product-domain need exists. Because Auth
and domain persistence use separate databases, there is intentionally no foreign key from domain
rows to Supabase Auth.

Companies belong to one authenticated user's namespace. Enforce company reuse with
`UNIQUE(user_id, normalized_name)` rather than a global company catalog. This avoids premature
global identity resolution, company merging, enrichment, and cross-user correction semantics.

Derive `normalized_name` deterministically by trimming outer whitespace, collapsing internal
whitespace, and applying Python `casefold`. This is not fuzzy matching, legal-entity resolution,
suffix stripping, aliasing, or enrichment.

Enforce same-owner company references with both:

```text
UNIQUE(companies.id, companies.user_id)

FOREIGN KEY (jobs.company_id, jobs.user_id)
REFERENCES companies(id, user_id)
```

PostgreSQL therefore prevents a job from referencing another user's company even if application
code is defective.

Scope every resource query by the authenticated user UUID at the SQL query layer. Unknown and
non-owned job IDs return the same `404` response so the API does not disclose another user's
resource existence.

Deleting a job or assigning it to a different company does not automatically delete the old
Company row. There is no company deletion or merge UI. Retaining these small private orphan rows is
currently preferable to adding concurrency-sensitive automatic cleanup.

## Alternatives Considered

- An ApplyGauge user/profile table immediately: rejected because no current domain attribute or
  lifecycle requires it.
- A cross-database foreign key to Supabase Auth: impossible across the intentionally separate
  PostgreSQL databases and undesirable provider coupling.
- A global company catalog: rejected because it requires unresolved merge, correction, enrichment,
  and cross-user ownership policies.
- Fuzzy or enriched company matching: rejected because deterministic normalization satisfies the
  current reuse requirement with understandable behavior.
- Automatic deletion of orphan companies: rejected because it adds concurrency and lifecycle
  complexity without a current user-facing benefit.

## Consequences

- Different users may have duplicate company rows by design.
- Global company analytics or enrichment would require a later architectural evolution.
- Deleting a Supabase Auth identity could leave domain rows unless explicit lifecycle cleanup is
  implemented later.
- No referential foreign key exists across the Auth and application PostgreSQL databases.
- Current normalization intentionally does not resolve every equivalent company spelling.
- Private orphan company rows may accumulate; company cleanup can be added when a real lifecycle
  requirement exists.
- Ownership is enforced redundantly by application queries and same-owner database integrity.
