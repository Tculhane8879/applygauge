# ApplyGauge v1 Release Checklist

This checklist records final developer release acceptance after the detailed Milestone 6 visual
acceptance passed. Completed items reflect performed checks; pull-request, merge, and tag gates
remain open. Synthetic/disposable data was used, and no passwords, access tokens, private signing
keys, or service-role credentials were recorded.

## Git and repository hygiene

- [x] Confirm the branch is the intended Milestone 6 branch and review the complete cumulative diff.
- [x] Confirm only approved Milestone 6 source, test, and documentation changes are present.
- [x] Confirm no files are unexpectedly staged and `git diff --check` passes.
- [x] Confirm `.env`, `.env.local`, `supabase/signing_keys.json`, generated output, caches, logs,
      dumps, editor files, and sensitive screenshots are untracked and ignored.
- [x] Search the diff for secrets, private keys, tokens, debug logging, unfinished TODOs, and private
      user information.

## Frozen dependencies and security

- [x] From a clean checkout, run `npm ci` and confirm the root `package-lock.json` is unchanged.
- [x] From `apps/api`, run `uv sync --frozen` and confirm `uv.lock` is unchanged.
- [x] Run `npm audit` and record any release-relevant findings.
- [x] Confirm no unapproved dependency or lockfile changes exist.

## Application database from zero

- [x] Start a new empty PostgreSQL database using the documented Compose configuration or a
      disposable isolated project/volume.
- [x] From `apps/api`, run `uv run alembic upgrade head`.
- [x] Run `uv run alembic current` and confirm `20260818_0004 (head)`.
- [x] Run `uv run alembic check` and confirm no new upgrade operations.
- [x] Confirm the canonical skill/term catalog seed is present and exact.
- [x] Run the complete PostgreSQL-backed backend suite.

## Local Supabase authentication

- [x] Follow the documented ignored empty-array signing-key initialization on a clean checkout.
- [x] Confirm `supabase/signing_keys.json` remains ignored and never display its private contents.
- [x] Start Supabase and confirm gateway `55021`, Auth database `54532`, and email UI `55124`.
- [x] Confirm Analytics and Studio remain disabled.
- [x] Confirm signup produces a captured confirmation email, confirmation succeeds, login succeeds,
      protected pages load, and Sign out clears the session.
- [x] Confirm issued tokens use ES256 and the expected issuer/audience without recording a token.

## Core product smoke test

- [x] Sign in as disposable User A and create a job with representative metadata and description.
- [x] Confirm deterministic canonical skills and provenance; add one skill manually.
- [x] Remove one detected skill, edit the description, and confirm durable correction semantics.
- [x] Edit job metadata and verify the saved values.
- [x] Change status and confirm current status plus immutable history.
- [x] Verify Dashboard totals, current-stage metrics, top skills, and recent opportunities.
- [x] Verify the complete Insights ranking, counts, percentages, and deterministic tie ordering.
- [x] Delete the disposable job through the compact confirmation and confirm it disappears.

## User isolation

- [x] Create or use disposable User B and confirm User B cannot see User A jobs or analytics.
- [x] Attempt representative cross-user detail, edit, status, skill, and delete requests and confirm
      nondisclosing not-found behavior.
- [x] Return to User A and confirm User B activity did not change User A data or aggregates.

## UI and failure smoke

- [x] At approximately 360px, 768px, and 1280px, spot-check the shell, Dashboard, Jobs, detail,
      forms, Insights, and Auth without horizontal overflow.
- [x] Complete a keyboard-only pass through navigation and the core job lifecycle.
- [x] Spot-check loading, empty, error, and not-found states plus long title/company/skill content.
- [x] Confirm Sign out remains legible in the application frame, with clear hover and focus states.
- [x] Confirm destructive interactions use the approved compact confirmation behavior.
- [x] Stop FastAPI while Next.js remains active and confirm safe API-unavailable states, then restart.
- [x] Invalidate a disposable session and confirm protected access returns to authentication without
      token/internal-error leakage.
- [x] Reference [the detailed Milestone 6 checklist](milestone-6-manual-acceptance.md) rather than
      repeating its already accepted full visual pass.

## Documentation and setup

- [x] Follow README setup in order from a clean checkout without relying on undocumented state.
- [x] Confirm ApplyGauge PostgreSQL and Supabase Auth PostgreSQL responsibilities are distinct.
- [x] Confirm migration, startup, health/readiness, testing, and non-destructive shutdown commands.
- [x] Review environment examples, architecture overview, ADRs 001–011, and all API documents.
- [x] Confirm README/spec limitations match the actual v1 and no live deployment is claimed.

## Automated build and CI parity

- [x] Run frontend Prettier, ESLint with zero warnings, strict TypeScript, Vitest, and production build.
- [x] Run backend Ruff formatting/linting, strict mypy, full PostgreSQL Pytest, and Alembic checks.
- [x] Validate `docker compose config --quiet` and PostgreSQL readiness.
- [x] Confirm GitHub Actions uses frozen installs, migrations, real PostgreSQL, and the same commands.
- [ ] Confirm the pull request is green before merge.

## Portfolio screenshots

Captured at a consistent desktop viewport, with no browser developer tools and one synthetic account
containing useful status and skill variety:

- [x] `docs/screenshots/dashboard.png`
- [x] `docs/screenshots/jobs.png`
- [x] `docs/screenshots/job-detail.png`
- [x] `docs/screenshots/insights.png`

Every image was reviewed against the current UI and contains no private user data, email address,
password, token, local secret, console error, or unrelated desktop content.

## Release

- [x] Obtain final developer release acceptance.
- [ ] Open the reviewed Milestone 6 pull request and confirm CI is green.
- [ ] Squash-merge the approved pull request into `main`.
- [ ] Update local `main` and rerun the final release smoke checks.
- [ ] Create the annotated tag only after that verification:

  ```bash
  git checkout main
  git pull origin main
  git tag -a v1.0.0 -m "ApplyGauge v1.0.0"
  git push origin v1.0.0
  ```

Do not tag an unmerged feature branch or use a lightweight tag for the v1 release.
