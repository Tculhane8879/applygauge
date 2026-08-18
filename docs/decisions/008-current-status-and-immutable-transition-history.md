# ADR 008: Current Status and Immutable Transition History

## Status

Accepted — Milestone 3

## Context

ApplyGauge needs efficient access to a job's current application state for ordinary list and detail
reads while also preserving chronological transitions for user review and future explainable
analytics. FastAPI is the sole application-domain writer and PostgreSQL is the portable domain
store.

## Decision

Store `jobs.current_status` as the current-state snapshot. Normal job reads do not derive status by
aggregating or selecting the latest event. This keeps list and detail queries simple, supports
future filtering and analytics, and avoids repeated latest-event work. FastAPI must maintain the
resulting snapshot/history invariant.

Store append-only `status_events` containing `id`, `user_id`, `job_id`, nullable `from_status`,
`to_status`, and `changed_at`. Events are historical facts: there is no event update endpoint,
individual delete endpoint, or `updated_at`. Deleting the owning job cascades its events.

Every job starts in `SAVED` and receives one initial `NULL → SAVED` event whose `changed_at` exactly
equals the job's `created_at`. The Milestone 3 migration backfills existing Milestone 2 jobs using
the same rule. `NULL` represents the absence of a prior application state more accurately than a
false `SAVED → SAVED` transition.

The complete status vocabulary is `SAVED`, `APPLIED`, `SCREENING`, `INTERVIEW`, `OFFER`, `REJECTED`,
and `WITHDRAWN`. Application strings and database checks enforce it; PostgreSQL native ENUM is not
used.

Allow any approved status to transition to any different approved status. Users need to correct
records and represent non-linear hiring outcomes, so a finite-state workflow graph would add
premature rigidity. A request for the current status is rejected with `409 Conflict`.

Each transition selects the owned job using both job and user IDs and acquires a PostgreSQL
`SELECT ... FOR UPDATE` row lock. Within one transaction, FastAPI captures the locked current value
as `from_status`, updates `jobs.current_status`, inserts exactly one event, flushes, and commits once.
Failure rolls back both changes. The lock ensures a concurrent transition observes the preceding
committed status instead of recording a stale duplicate transition chain. PostgreSQL
`clock_timestamp()` supplies normal transition timestamps; initial events use `jobs.created_at`.

Store event ownership redundantly and enforce it through:

```text
UNIQUE (jobs.id, jobs.user_id)

FOREIGN KEY (status_events.job_id, status_events.user_id)
REFERENCES jobs(id, user_id)
ON DELETE CASCADE
```

This is defense in depth alongside ownership-scoped FastAPI queries.

FastAPI service transactions maintain consistency. Do not add a database trigger, finite-state
machine, workflow engine, or event-sourcing framework.

## Alternatives Considered

- Derive current status from the latest event: rejected because ordinary reads would require
  latest-event aggregation and future current-state queries would be less direct.
- Store only the current snapshot: rejected because transition history is a v1 product requirement
  and supports later funnel and time-to-stage analysis.
- PostgreSQL native ENUM: rejected because check-constrained strings keep migrations and portable
  schema evolution simpler.
- Database triggers: rejected because FastAPI is the sole domain writer and explicit service
  transactions keep behavior visible and testable.
- A finite-state transition graph or workflow library: rejected because unrestricted corrections
  are intentional and current workflow complexity does not justify either abstraction.
- Event sourcing: rejected because ApplyGauge needs a small snapshot-plus-history model, not event
  replay as the source of all domain state.

## Consequences

- Snapshot/history divergence is theoretically possible if a future writer bypasses the FastAPI
  transition service.
- Deleting a job intentionally deletes its historical events while retaining its company.
- Unrestricted corrections reduce workflow rigidity but allow sequences that do not represent a
  strictly forward hiring funnel.
- The database permits nullable `from_status` structurally and does not restrict it exclusively to
  the first event; application behavior and migration establish that invariant.
- Future analytics may use `current_status` for current-state metrics and history for transition or
  duration metrics without changing current reads.
- A current-status index is deferred until an implemented filter or analytics query demonstrates a
  need for it.
