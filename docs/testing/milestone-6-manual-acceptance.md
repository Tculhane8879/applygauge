# Milestone 6 Manual Visual and UX Acceptance

This deterministic checklist covers the locked v1 visual baseline, responsive behavior, state
handling, keyboard access, and failure safety. It is intended for developer execution after the
automated Increment 3 checks and again during release verification. It has **not** been executed by
Codex. Use disposable jobs where destructive or controlled-state checks are required; do not delete
persistent authentication accounts.

## Startup

1. Start the application database with `docker compose up -d postgres`.
2. From `apps/api`, run `uv run alembic upgrade head`, `uv run alembic current`, and
   `uv run alembic check`; confirm the single current revision is the repository head.
3. Start local authentication with `npx --no-install supabase start --workdir .`.
4. Start FastAPI from `apps/api` with
   `uv run uvicorn applygauge_api.main:app --reload`.
5. Start Next.js from the repository root with `npm run dev:web`.
6. Confirm `GET http://127.0.0.1:8000/api/v1/health` and
   `GET http://127.0.0.1:8000/api/v1/health/ready` succeed.

## Authentication and session behavior

1. At `/login`, sign in with a confirmed test account and confirm arrival at `/dashboard`.
2. If signup is being rechecked, create a disposable account, open its captured confirmation email,
   follow the confirmation link, and then sign in. Do not expose the password or token in notes.
3. Use Sign out. Confirm it remains a native POST action and returns to the anonymous flow.
4. While signed out, request `/dashboard`, `/jobs`, a known `/jobs/{id}`, and `/insights`; confirm
   each reaches `/login` without an infinite redirect.
5. If practical, expire/revoke a test session or clear its auth cookies, then request a protected
   page. Confirm the app requests authentication rather than presenting an empty product state.
6. If practical, preserve an authenticated-looking browser page while causing an API request to
   receive `401`. Confirm no token, response body, user identifier, or raw internal error is shown.

## Viewport matrix and visual shell

Run each product-page section below at approximately `360px`, `768px`, and `1280px` viewport widths.
At every width:

- Confirm the deep indigo frame and warm workspace remain continuous and correctly rounded.
- Confirm the wordmark, Dashboard/Jobs/Insights navigation, and Sign out wrap without collision.
- Confirm the current destination has its underline and accessible current-page state.
- Confirm inactive navigation and Sign out are readable; hover and focus remain visible on the dark
  frame without making Sign out appear active.
- Confirm the document has no normal horizontal scrollbar.

## Dashboard states

1. With representative data, confirm the heading, summary metrics, pale analytics group, top skills,
   and recent opportunities follow the approved composition.
2. With no jobs, confirm the product-specific empty heading, supporting copy, and Add job action.
3. With jobs but no visible skills, confirm metrics and recent jobs remain and skill guidance is
   shown; it must differ from both no-jobs and API-error states.
4. Navigate to Dashboard while throttling briefly and confirm the warm skeleton geometry resembles
   the final metrics and content, with no dark slate placeholders.
5. Stop FastAPI while Next.js remains running, reload Dashboard, and confirm a restrained alert says
   data is unavailable—not that there are zero jobs or skills. Restart FastAPI afterward.
6. Use a recent job titled “Senior Staff Distributed Systems and Developer Infrastructure Software
   Engineer” with a long company name. Confirm full text and status remain readable at all widths.

## Jobs list

1. Confirm normal rows show full title, company, location, work arrangement, employment type, status,
   and tracked date, and the entire row opens the correct job.
2. With no jobs, confirm “No saved jobs yet” remains visually distinct from an error and the page-level
   Add job action is available.
3. Use long title/company/location values, including a long remote-location phrase. Confirm wrapping,
   status visibility, mobile stacking, and no truncation or horizontal overflow.
4. Tab to a row and press Enter. Confirm the focus indicator is visible and the correct detail opens.
5. With FastAPI stopped, reload `/jobs`; confirm a safe Saved jobs unavailable alert rather than the
   empty state. Restart FastAPI.

## Job detail

1. Confirm a long title and company wrap while status and Edit remain accessible.
2. Confirm location, arrangement, employment type, saved/updated timestamps, and a long posting URL
   remain understandable. Open the posting and confirm safe new-tab behavior.
3. Change application status and confirm the pending state prevents duplicate submission, the new
   status appears, and history retains the transition.
4. Confirm skills show exact canonical names and provenance, including `C++`, `C#`, `GitHub Actions`,
   and a long skill name when present.
5. Tab to a Remove action. Confirm its accessible name includes the skill, its pending label is
   contextual, and a controlled failure appears as a safe associated alert. No confirmation is
   expected.
6. Confirm multi-paragraph descriptions retain line breaks and a long technical token wraps without
   causing horizontal overflow.
7. Confirm status history remains readable and ordered.
8. Activate Delete job by keyboard. Confirm focus moves to the destructive confirmation action;
   activate Cancel and confirm focus returns to the trigger.
9. Reopen deletion and, if practical, induce a failed request. Confirm the compact region remains
   stable, the error wraps and is announced, and retry is possible. Confirm pending deletion disables
   both actions and prevents duplicate submission.
10. Request a nonexistent owned job URL and confirm “Job not found,” safe explanatory copy, and the
    Return to saved jobs action, with no internal details.

## Create and edit forms

1. Create a job with required fields and confirm only one record is produced.
2. Submit missing/invalid values. Confirm labels remain explicit, invalid fields are identified,
   long validation messages wrap, and focus indicators remain visible.
3. Use a long URL, location, title, company, and multi-paragraph description; save and verify the full
   values on detail without layout overflow.
4. Edit required and optional values, including clearing optional URL/location/description fields,
   and confirm their null behavior remains correct.
5. At `360px`, confirm two-column groups collapse and Save/Cancel wrap in logical order.
6. Throttle a submit and attempt a second activation. Confirm the pending label and disabled control
   prevent duplicate submission.

## Insights states

1. Confirm the full ranking order, rank number, exact skill name, job count, percentage, and progress
   track; text must communicate the value without relying on the bar or color.
2. Use a long canonical skill name. Confirm rank, name, count, and percentage wrap without collision
   at all three viewport widths.
3. With no jobs, confirm the no-jobs state and Add job action. With jobs but no skills, confirm the
   distinct no-skills guidance and absence of the Add job action.
4. Navigate while throttling briefly and confirm the warm ranked-row skeleton and reduced-motion-safe
   behavior.
5. Stop FastAPI, reload Insights, and confirm a restrained Insights unavailable alert rather than an
   empty ranking. Restart FastAPI.

## Authentication pages

1. At `/login` and `/signup`, confirm the auth card fits vertically and horizontally at `360px` and
   remains appropriately constrained at `768px` and `1280px`.
2. Tab through every field and action. Confirm order is logical, focus is visible, labels are announced,
   and Enter submits normally.
3. Confirm email and password-manager autofill works with email/current-password/new-password fields.
4. Trigger field and form errors. Confirm long messages wrap, are announced, and do not expose raw
   provider responses.
5. Throttle submission and confirm the pending/disabled state blocks duplicate submission.

## Complete keyboard pass

Without using a pointer, traverse: wordmark; primary navigation; Sign out; Dashboard Add job/recent
job/Insights links; Jobs Add job and full-row links; detail Edit, status select/update, skill input/add,
Remove, posting link, Delete, confirmation and Cancel; form fields/submit/cancel; and login/signup
fields and actions. Confirm logical DOM order, native Enter/Space behavior, no keyboard trap, no
hidden or lost focus, and an obvious focus indicator on both dark and light surfaces.

## Console, network, motion, and leakage

1. During the complete pass, confirm the browser console has no hydration or runtime errors.
2. Inspect Network responses for unexpected `500` responses; expected controlled failures should be
   understood and then cleared.
3. Confirm UI copy never exposes bearer tokens, cookies, passwords, Supabase private keys, raw API
   bodies, SQL, stack traces, or cross-user identifiers.
4. Enable the operating system/browser reduced-motion preference and repeat loading/navigation checks.
   Confirm skeleton animation is suppressed and no transition is required to understand state.
5. Restore FastAPI and any throttling/failure injection, then confirm health/readiness and all pages
   return to their normal states.
