# Jobs API

Milestone 3 extends authenticated job CRUD with application status and immutable history. Domain
data is stored in the ApplyGauge PostgreSQL database and is never read or written through Supabase
database APIs.

## Authentication and ownership

Every endpoint requires a Supabase access token in the `Authorization: Bearer <token>` header.
FastAPI validates the token and derives ownership exclusively from its authenticated `sub` UUID.
Requests cannot supply or override a job owner.

List and detail queries include the authenticated user ID in their SQL predicates. A missing job
and a job owned by somebody else both return the same `404` response so resource existence is not
disclosed across accounts.

## Create a job

```http
POST /api/v1/jobs
```

Returns `201 Created`. The request accepts:

- `company_name` and `title` as required strings;
- nullable `description`, `job_url`, and `location`;
- `work_arrangement`, defaulting to `UNKNOWN`;
- `employment_type`, defaulting to `UNKNOWN`.

The backend resolves a company within the authenticated user's private company namespace. Matching
uses a whitespace-normalized, case-folded name, so spelling such as `Acme` and `ACME` reuses the
same company for one user without sharing that company record with other users.

Every new job starts with `current_status: "SAVED"`. Creation also appends the first immutable
status event, from `null` to `SAVED`, using the job's creation timestamp.
When a description is present, the same transaction synchronously extracts reviewed skill terms
and creates detected canonical associations. Job, initial status, and detection commit once; an
unexpected extraction failure rolls back the entire creation.

## List jobs

```http
GET /api/v1/jobs
```

Returns `{"items": [...]}` containing only the authenticated user's jobs. Results are ordered by
`created_at DESC, id DESC`. Search, filters, pagination controls, and selectable sorting are not
currently implemented.

## Get one job

```http
GET /api/v1/jobs/{job_id}
```

Returns the owned job or:

```json
{ "detail": "The requested job could not be found." }
```

with status `404` for both unknown and non-owned IDs.

## Update a job

```http
PATCH /api/v1/jobs/{job_id}
```

The request accepts any supported create field, but at least one field must be supplied. Omitted
fields retain their current values. Explicit `null` clears `description`, `job_url`, or `location`;
required fields such as company name, title, work arrangement, and employment type reject `null`.

Changing `company_name` resolves or creates a different company inside the authenticated user's
private namespace and repoints only this job. It never renames the old company row. The old company
is retained even when it no longer has an associated job.

This general metadata endpoint does not accept `current_status`. Status changes use the dedicated
pipeline endpoint below and always preserve history.

When `description` is explicitly changed, the owned job row is locked and metadata plus detected
skill reconciliation commit atomically. An omitted or unchanged description does not run
extraction. Clearing it removes detected-only associations, converts dual provenance to
manual-only, and preserves manual-only associations and prior corrections.

## Change application status

```http
PATCH /api/v1/jobs/{job_id}/status
```

The request body is `{"status": "APPLIED"}` where status is one of `SAVED`, `APPLIED`,
`SCREENING`, `INTERVIEW`, `OFFER`, `REJECTED`, or `WITHDRAWN`. All transitions are allowed so users
can correct their records. The backend locks the owned job row, atomically updates its current
status, and appends one immutable history event. Requesting the current status is rejected with
`409 Conflict` and does not append an event.

## Read status history

```http
GET /api/v1/jobs/{job_id}/status-events
```

Returns `{"items": [...]}` ordered by `changed_at ASC, id ASC`. Each event contains its ID,
nullable previous status, new status, and database-generated timestamp. Ownership columns are not
returned. History events cannot be edited or deleted independently.

## Delete a job

```http
DELETE /api/v1/jobs/{job_id}
```

Successful deletion returns `204 No Content` with an empty body. Only the job is deleted; its
company remains available for later reuse. The deleted job's status events are removed by database
cascade because they cannot exist independently of their job. ApplyGauge does not use soft
deletion.

## Response shape

Job responses contain the job ID, a compact company object (`id` and `name`), title, optional URL,
location and description, work arrangement, employment type, `current_status`, and
creation/update timestamps.
Ownership IDs and internal company normalization fields are not exposed.

## Current limitations

The Next.js frontend provides authenticated list, detail, create, edit, and confirmed-delete flows.
Mutations run through Server Actions that call this FastAPI API; the frontend does not write through
Supabase database APIs. The frontend shows current status on job lists and details, renders
immutable history, and changes status through an authenticated Server Action that calls the
dedicated transition endpoint. History remains server-authoritative and refreshes from FastAPI
after a successful transition. Job detail also lists canonical skills, shows manual/detected
provenance, and supports correction through the separate API below. Notes, search, filtering, and
analytics belong to later milestones.

Authenticated manual job-skill endpoints are documented separately in the
[Job Skills API](skills.md). The job list and create/edit metadata forms intentionally remain
skill-control-free; saving description metadata triggers backend extraction while manual
associations are managed separately on job detail.
