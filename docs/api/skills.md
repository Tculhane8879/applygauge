# Job Skills API

Milestone 4A provides authenticated manual management of canonical skills attached to saved jobs.
The catalog is global, curated application vocabulary; job-skill associations remain private to
the job owner. There is no catalog creation, update, deletion, search, or analytics API.

The current migration-backed baseline contains 24 canonical skills and 14 aliases across the
`LANGUAGE`, `FRAMEWORK`, `DATABASE`, `CLOUD`, `DEVOPS`, `MESSAGING`, `TESTING`, and `OTHER`
categories. Canonical names and aliases share one globally unique normalized-term namespace.
Catalog additions require reviewed migrations; ordinary users cannot mutate this vocabulary.
The rationale and persistence decisions are recorded in
[ADR 009](../decisions/009-global-skill-vocabulary-and-deterministic-term-resolution.md).

All endpoints require a Supabase access token in the `Authorization: Bearer <token>` header.
FastAPI derives ownership from the authenticated identity and never accepts `user_id` from input.
A missing job and a job owned by somebody else return the same nondisclosing `404` response.

## List an owned job's skills

```http
GET /api/v1/jobs/{job_id}/skills
```

Returns canonical skills ordered by canonical display name and UUID. A job with no skills returns
`{"items": []}`. Responses expose only each skill's ID, canonical name, and category; aliases,
normalized lookup keys, ownership data, associations, and usage counts are not exposed.

## Add a skill

```http
POST /api/v1/jobs/{job_id}/skills
Content-Type: application/json

{
  "name": "Postgres"
}
```

The submitted name is normalized and resolved by exact lookup in the unified canonical-and-alias
term namespace. The response always uses canonical display data, so `Postgres`, `POSTGRESQL`, and
`psql` all return `PostgreSQL`. There is no fuzzy, prefix, substring, NLP, or AI matching.

- A newly created association returns `201 Created`.
- An existing canonical association returns `200 OK`, including when retried through another alias.
- An unknown term returns `422` with `That skill is not available in the catalog.`
- Unknown terms never create catalog records.

Duplicate handling uses PostgreSQL conflict-safe insertion, so concurrent retries leave exactly one
association.

## Remove a skill association

```http
DELETE /api/v1/jobs/{job_id}/skills/{skill_id}
```

Returns `204 No Content`. Removal is idempotent for an owned job: an absent association or unknown
skill UUID also returns `204`, avoiding disclosure of global catalog membership. This operation
deletes only the requested job association; it never deletes the global skill, its terms, or
another job's association.

Deleting the owning job continues to cascade its private skill associations while retaining the
global catalog.

## Frontend behavior and current boundary

The job detail page lists canonical skill names and provides authenticated add/remove controls.
Frontend mutations pass through Server Actions and the centralized authenticated API client; they
do not bypass FastAPI. Successful mutations revalidate and refresh only the affected job detail
route, so the displayed collection is always re-read from the backend rather than updated
optimistically. Failed additions preserve the submitted input and return safe, actionable errors.

Aliases are resolved by FastAPI and are never stored or presented as association identity. A
duplicate canonical association is a successful no-op whether the backend responds with `200` or
`201`. If the skill read fails, the detail page shows an unavailable state and suppresses mutation
controls rather than presenting potentially stale state.

Deterministic description extraction, MANUAL/DETECTED provenance, correction preservation, and
analytics belong to Milestone 4B or later.
