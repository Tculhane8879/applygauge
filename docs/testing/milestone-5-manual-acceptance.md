# Milestone 5 Manual Browser Acceptance

This checklist is for developer execution after automated review. It has **not** been executed by
Codex. Preserve the persistent User A and User B authentication accounts; delete only disposable
jobs when preparing controlled data.

## Startup

1. Start PostgreSQL with `docker compose up -d postgres`.
2. From `apps/api`, run `uv run alembic upgrade head` and `uv run alembic current`.
3. Confirm `20260818_0004 (head)`.
4. Start Supabase with `npx --no-install supabase start --workdir .`.
5. Start FastAPI with `uv run uvicorn applygauge_api.main:app --reload` from `apps/api`.
6. Start Next.js with `npm run dev:web` from the repository root.

## Controlled User A fixture

Prefer deleting existing disposable User A jobs so expected values are exact. Otherwise record the
baseline and account for it explicitly. Do not delete either authentication account.

Create seven User A jobs, one per current status, with these visible skills:

| Job | Status | Skills |
| --- | --- | --- |
| 1 | SAVED | Python, PostgreSQL |
| 2 | APPLIED | Python, Docker |
| 3 | SCREENING | Python, React |
| 4 | INTERVIEW | Python, PostgreSQL, Docker |
| 5 | OFFER | React, PostgreSQL |
| 6 | REJECTED | Docker |
| 7 | WITHDRAWN | none |

Expected summary: total `7`, applied-or-later `5`, interview `1`, response rate `80.0%`.

Expected ranking:

1. Python — 4 jobs — 57.1%
2. Docker — 3 jobs — 42.9%
3. PostgreSQL — 3 jobs — 42.9%
4. React — 2 jobs — 28.6%

Docker precedes PostgreSQL on the count tie because names sort alphabetically.

## Dashboard and Insights

1. Sign in as User A and open `/dashboard`.
2. Verify the four exact summary values above and the current-stage response-rate explanation.
3. Verify the four skills, counts, percentages, and order above.
4. Verify exactly five recent opportunities, newest created first.
5. Open a recent job and confirm the correct detail, then return.
6. Follow **View all insights** and confirm `/insights` shows ranks 1–4 and the same values.
7. Confirm Insights has no search, threshold, status, date, or category filter.
8. Add two known distinct skills such as Java and Kubernetes across controlled jobs. Confirm the
   Dashboard shows only five skills while Insights shows all six in backend ranking order.

## Mutation-driven checks

1. Change Job 1 from SAVED to APPLIED. Confirm total stays `7`, applied becomes `6`, and response
   becomes `66.7%` (`4/6`). Restore SAVED afterward if desired.
2. Add React manually to a job without it. Confirm its count increases by one and percentage uses
   denominator `7`; remove it and confirm both restore.
3. Add an extraction-enabled catalog term to a description. Confirm demand increases. Remove the
   term and confirm detected-only demand disappears unless manual provenance retains it.
4. Delete a controlled job. Confirm total, applicable status counts, skill counts, denominator,
   percentages, and recent opportunities update. Recreate it if retaining the fixture.

## Isolation and states

1. Record User A values, sign out, and sign in as User B.
2. Create a User B job with overlapping Python/Docker skills. Confirm User B sees only User B data.
3. Return to User A and confirm every recorded value is unchanged.
4. With User B disposable jobs removed, confirm Dashboard shows the no-jobs onboarding state and
   Add job CTA, and Insights shows its distinct no-jobs state.
5. With one job but no visible skills, confirm Dashboard metrics/recent jobs remain, both pages show
   skill guidance, and neither reports an API error.

## Navigation, accessibility, responsiveness, and failure

1. Verify Dashboard, Jobs, Insights, and Sign out destinations.
2. Keyboard-navigate primary links, recent jobs, Add job, and View all insights.
3. At a narrow/mobile viewport, confirm cards stack; navigation and long job/company/skill names
   wrap; counts and percentages stay visible; and bars/color are not required for meaning.
4. Check the console for hydration/runtime errors and confirm no unexpected 500 responses.
5. Temporarily stop FastAPI while authenticated. Confirm Dashboard shows the safe analytics error,
   not zero data. Repeat for Insights if useful, then restart FastAPI.
6. Confirm no raw API body, SQL detail, bearer token, or cross-user identifier appears in the UI.
