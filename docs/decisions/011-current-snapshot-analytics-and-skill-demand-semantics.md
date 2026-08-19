# ADR 011: Current-Snapshot Analytics and Skill-Demand Semantics

## Status

Accepted — Milestone 5

## Context

ApplyGauge has user-owned jobs, unrestricted current application-status corrections, immutable
status history, canonical visible skill associations, manual/detected provenance, and durable
suppression state. Milestone 5 needs useful, explainable analytics without claiming that corrected
current states describe a historical funnel or introducing stored analytics infrastructure.

## Decision

### Current-snapshot analytics

Milestone 5 analytics describe current domain state only. They use current owned jobs,
`jobs.current_status`, and current visible `job_skills`. They do not derive metrics from
`status_events`, deleted jobs, suppressions, or extraction matches without visible associations.
Because users may freely correct statuses and move backward or sideways, treating transitions as a
strict historical funnel would produce misleading conversion claims.

### Direct PostgreSQL aggregates

FastAPI computes analytics directly from normalized PostgreSQL truth. There is no analytics table,
materialized view, cached counter, Redis dependency, or invalidation system. Portfolio-scale data
does not justify duplicated state, and direct aggregation keeps mutation results immediately
consistent with the domain source of truth.

### Skill demand and denominator

For one authenticated user, skill demand is the number of currently owned jobs visibly associated
with a canonical skill. The `(job_id, skill_id)` association counts exactly once: manual-only,
detected-only, and manual-plus-detected states contribute equally and provenance is not counted
separately. Suppressed skills contribute zero because no visible `job_skills` row exists.

The percentage denominator is all currently owned jobs, including jobs without skills:

```text
job_count / total_jobs * 100
```

Restricting the denominator to jobs with skills would inflate demand and hide incomplete job data.

### Deterministic percentages and ranking

FastAPI calculates percentages with `Decimal`, rounds to one decimal using `ROUND_HALF_UP`, and
returns JSON numbers. Examples include `1/3 → 33.3`, `2/3 → 66.7`, and `1/16 → 6.3`. The frontend
uses one-decimal display formatting but does not recalculate percentages.

Skill ordering is `job_count DESC`, `skill.name ASC`, then `skill.id ASC`. The Dashboard uses the
first five; Insights receives the complete ranking. The frontend preserves supplied order.

### Application summary and response rate

`total_jobs` counts all current owned jobs. `applied_jobs` counts current `APPLIED`, `SCREENING`,
`INTERVIEW`, `OFFER`, and `REJECTED` jobs. `interview_jobs` counts current `INTERVIEW` jobs. The
internal responded set is `SCREENING`, `INTERVIEW`, `OFFER`, and `REJECTED`.

Current-state response rate is:

```text
responded_jobs / applied_jobs * 100
```

It is `null` when `applied_jobs` is zero. This is not historical employer-response probability,
application or funnel conversion, or lifetime response rate. `SAVED` and `WITHDRAWN` contribute
only to `total_jobs`. `WITHDRAWN` is excluded because its current state cannot establish whether
withdrawal occurred before or after an application.

### Recent opportunities and endpoint split

Recent opportunities are the five most recently tracked jobs, ordered by `created_at DESC`, then
`id DESC`. Editing an old job must not make it appear newly tracked, so `updated_at` is not used.

The read-only authenticated endpoints are:

- `GET /api/v1/analytics/overview`, a bounded Dashboard response;
- `GET /api/v1/analytics/skills`, the complete Insights ranking.

There are no analytics mutation or filter endpoints in Milestone 5.

### Security, consistency, and schema

Every aggregate starts from authenticated identity and owned jobs. There is no `user_id` input,
public/global analytics route, or cross-user denominator. Global canonical skills contribute only
through owned job associations.

Normal PostgreSQL `READ COMMITTED` semantics apply. The three overview queries may observe slightly
different committed moments during concurrent mutations; guaranteed cross-section point-in-time
consistency is unnecessary for this personal dashboard. No locks or repeatable-read transaction
are added.

Milestone 5 adds no migration 0005, speculative index, or dependency. Existing indexes and schema
are adequate; future indexes must be justified by measured query plans.

## Alternatives Considered

- Historical funnel analytics from status events: rejected because unrestricted corrections do
  not establish a reliable forward funnel.
- Persisted aggregates or materialized views: rejected because they duplicate truth and require
  invalidation without a demonstrated scale need.
- Counting provenance states: rejected because demand concerns jobs containing a skill, not how
  the association arose.
- Skills-only denominator: rejected because it inflates percentages when jobs lack skill data.
- Frontend aggregation: rejected because FastAPI owns analytics semantics and authorization.
- `updated_at` for recent opportunities: rejected because edits are not newly tracked jobs.
- Speculative indexes: rejected until measurements demonstrate a need.

## Consequences

- Dashboard sections can reflect slightly different committed moments during concurrent writes.
- Current-state response rate is intentionally narrower than future historical response analysis.
- Direct aggregation trades a small query cost for simple, immediately correct results.
- The all-job denominator can yield lower but more truthful skill percentages.
- Suppressed corrections naturally disappear from demand without special analytics logic.
- No trend, funnel, conversion-history, or time-to-stage analysis exists.
- Future filters may require indexes chosen from measured query plans, but this ADR does not decide
  those features.
