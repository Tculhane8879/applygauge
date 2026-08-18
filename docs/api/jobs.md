# Jobs API

Milestone 2 exposes authenticated CRUD operations for saved jobs. Domain
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

## Delete a job

```http
DELETE /api/v1/jobs/{job_id}
```

Successful deletion returns `204 No Content` with an empty body. Only the job is deleted; its
company remains available for later reuse. ApplyGauge does not use soft deletion.

## Response shape

Job responses contain the job ID, a compact company object (`id` and `name`), title, optional URL,
location and description, work arrangement, employment type, and creation/update timestamps.
Ownership IDs and internal company normalization fields are not exposed.

## Current limitations

The Next.js frontend provides authenticated list, detail, create, edit, and confirmed-delete flows.
Mutations run through Server Actions that call this FastAPI API; the frontend does not write through
Supabase database APIs. Application status, notes, skills, search, filtering, and analytics belong
to later increments or milestones.
