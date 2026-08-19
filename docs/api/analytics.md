# Analytics API

ApplyGauge exposes authenticated, read-only current-snapshot analytics. Every query is scoped
through the authenticated user's jobs; clients cannot provide a user ID or analytics filter.
Both endpoints require a Supabase bearer token. They expose no mutation methods, ownership IDs,
provenance flags, suppression state, status history, or aggregate implementation fields.

## `GET /api/v1/analytics/overview`

Returns totals for all currently tracked jobs, current applied and interview counts, the five
highest-demand visible skills, and the five most recently created opportunities. Recent jobs are
ordered by `created_at` descending and then ID descending.

`total_jobs` includes every owned job. `applied_jobs` includes current `APPLIED`, `SCREENING`,
`INTERVIEW`, `OFFER`, and `REJECTED` jobs. `interview_jobs` includes only current `INTERVIEW` jobs.

`response_rate_percentage` is a **current-snapshot** metric: current jobs in `SCREENING`,
`INTERVIEW`, `OFFER`, or `REJECTED`, divided by current jobs in `APPLIED` plus those four statuses.
It is `null` when there are no qualifying applied jobs. It is not an application-history funnel,
employer conversion probability, or historical response rate. `SAVED` and `WITHDRAWN` count only
toward the total.

## `GET /api/v1/analytics/skills`

Returns the complete ranked skill-demand list. A visible canonical skill association counts once
per job regardless of manual/detected provenance. Suppressions do not count. Percentages use all
owned jobs, including jobs without skills, and the backend rounds them to one decimal place using
decimal round-half-up behavior.

Ranking is job count descending, skill name ascending, then skill ID ascending. Neither endpoint
accepts query parameters. Users with no jobs receive `200 OK` with zero totals and empty lists.
The overview executes a summary, bounded skill-demand, and recent-job query; Insights executes a
total and complete skill-demand query. Normal PostgreSQL `READ COMMITTED` semantics apply. There is
no analytics cache, persistence model, materialized view, lock, or repeatable-read guarantee.

## Frontend consumers

The authenticated `/dashboard` Server Component uses the overview response for summary cards,
top-five skill demand, and recently created opportunities. The authenticated `/insights` Server
Component renders the complete skill ranking. Both views preserve backend ordering and values;
frontend code only formats percentages for display and does not recalculate analytics.
