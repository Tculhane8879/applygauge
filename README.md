# ApplyGauge

ApplyGauge is a personal job-search intelligence platform for tracking software-engineering
opportunities and learning which technical skills appear most often across the jobs a user is
targeting.

The project exists both to solve a real job-search problem and to demonstrate a thoughtfully
designed, tested, and documented full-stack system built with React, Next.js, TypeScript, Python,
FastAPI, and PostgreSQL.

## Project status

ApplyGauge has completed Milestones 0–4A. **Milestone 4B: Deterministic Skill Extraction** is
implementation-complete and pending developer manual acceptance. Authentication, user-facing job
CRUD, the application pipeline, canonical skills, deterministic extraction, durable manual
correction, and accessible provenance display are implemented.

Implemented today:

- npm-workspace and uv-managed monorepo foundations;
- a minimal Next.js application;
- a minimal FastAPI application;
- PostgreSQL local infrastructure through Docker Compose;
- API liveness and database-readiness endpoints;
- frontend-to-backend connectivity indication;
- baseline frontend and backend tests;
- formatting, linting, strict typing, builds, and continuous integration;
- a reproducible local Supabase Auth stack with ES256/JWKS and email capture;
- FastAPI bearer-token validation and `GET /api/v1/auth/me`;
- Next.js SSR signup, confirmation, login, protected dashboard, and sign-out.
- PostgreSQL-backed, ownership-scoped company resolution and job CRUD through FastAPI;
- authenticated Saved Jobs list, detail, create, edit, and delete flows in Next.js.
- checked current-status snapshots and immutable application-status history;
- atomic, row-locked status transitions with ownership protection;
- frontend status badges, chronological history, and authenticated status changes.
- a curated global canonical skill catalog with deterministic aliases;
- ownership-protected backend job-skill list/add/remove APIs;
- canonical skill display, empty/error states, and authenticated add/remove controls on job detail.
- explicit migration-backed extraction eligibility for reviewed canonical terms and aliases;
- synchronous deterministic extraction during job creation and changed-description updates;
- atomic manual/detected provenance reconciliation with durable false-positive correction;
- accessible `Manual`, `Detected`, and `Manual + detected` labels on job detail.

The v1 product features described below are planned, not yet implemented.

## Planned v1 scope

Version 1 will let independent users manually save job opportunities, track application status
history, preserve notes, and view explainable aggregate job-search insights. Authentication,
strict per-user isolation, deterministic detection, and correction of known technologies are
already implemented foundations for that remaining scope.

Browser capture, resume intelligence, semantic/vector retrieval, background workers, and applied AI
belong to later versions and are intentionally excluded from v1 and the current milestone.

## Architecture

```text
Next.js / React / TypeScript
             |
             v
       FastAPI / Python
             |
             v
          PostgreSQL
```

Next.js owns presentation and browser interaction. FastAPI is the application API and future
business-logic boundary. PostgreSQL is the portable relational persistence layer. Normal domain
operations must flow through FastAPI rather than bypassing it through generated database APIs.

The primary development loop runs Next.js and FastAPI directly on the host while PostgreSQL runs in
Docker. See the [architecture overview](docs/architecture/overview.md) for the full boundary and
deployment discussion.

## Technology stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Python, FastAPI, Pydantic, SQLAlchemy, Alembic
- Database: PostgreSQL
- Frontend quality: Prettier, ESLint, Vitest, React Testing Library
- Backend quality: Ruff, mypy, Pytest
- Tooling: npm workspaces, uv, Docker Compose, GitHub Actions
- Identity: Supabase Auth with FastAPI-side ES256/JWKS validation

## Repository structure

```text
applygauge/
|-- .github/workflows/ci.yml
|-- apps/
|   |-- api/                 # FastAPI package, tests, and Alembic environment
|   `-- web/                 # Next.js application and frontend tests
|-- docs/
|   |-- api/                 # Current API documentation
|   |-- architecture/        # Architecture overview
|   |-- decisions/           # Architecture Decision Records
|   `-- PROJECT_SPEC.md      # Authoritative project specification
|-- .env.example             # Local PostgreSQL Compose configuration
|-- docker-compose.yml       # Local PostgreSQL service
|-- package.json             # Root npm workspace commands
`-- package-lock.json        # Single Node dependency lockfile
```

There is no shared package until genuinely shared code exists. Milestone 2 introduced the first
product database models and Alembic migration for user-owned companies and jobs.

## Prerequisites

- Git
- Node.js 20.19 or newer
- npm 10 or newer
- Python 3.13
- [uv](https://docs.astral.sh/uv/)
- Docker Desktop or another Docker Engine with Compose support

All required tools and dependencies are free to use locally.

## Local setup

Clone the repository and enter it, then install locked dependencies:

```bash
npm ci
cd apps/api
uv sync --frozen
cd ../..
```

Create local environment files from the committed examples.

PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
```

macOS/Linux:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

The checked-in values are local-development defaults, not production secrets. Do not commit the
copied files.

### 1. Start PostgreSQL

From the repository root:

```bash
docker compose up -d postgres
docker compose ps
```

The container is ready when its status is `healthy`. To inspect logs:

```bash
docker compose logs postgres
```

### 2. Start FastAPI

For authentication development, initialize the ignored local signing key once and start Supabase.
The [local authentication guide](docs/authentication/local-development.md) documents the CLI 2.114.0
compatibility step and Windows port map.

```bash
npx --no-install supabase start --workdir .
```

In a second terminal:

```bash
cd apps/api
uv run uvicorn applygauge_api.main:app --reload
```

FastAPI runs at `http://localhost:8000`. Interactive OpenAPI documentation is available at
`http://localhost:8000/docs`.

### 3. Start Next.js

In a third terminal from the repository root:

```bash
npm run dev:web
```

The frontend runs at `http://localhost:3000` and displays its connection state to FastAPI.

## Environment variables

| File                  | Visibility                     | Variables                                                                                      |
| --------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `.env`                | Docker Compose/local only      | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`                           |
| `apps/api/.env`       | Private backend                | `APP_ENV`, `DATABASE_URL`, `CORS_ORIGINS`, `SUPABASE_URL`, `SUPABASE_JWT_AUDIENCE`             |
| `apps/web/.env.local` | Browser-visible where prefixed | `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |

`NEXT_PUBLIC_` values are compiled into browser code and must never contain secrets. Backend and
database credentials must never be exposed through that prefix. The Supabase URL is public;
signing keys and service credentials must never be committed or placed in frontend configuration.

## Health and readiness

With PostgreSQL and FastAPI running:

```bash
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/health/ready
```

Expected responses:

```json
{"status":"ok"}
{"status":"ready"}
```

The liveness endpoint verifies that the API process can serve requests. The readiness endpoint also
executes `SELECT 1` against PostgreSQL and returns HTTP 503 when the database is unavailable. See the
[foundation endpoint documentation](docs/api/health.md).

## Development commands

Run frontend commands from the repository root:

```bash
npm run dev:web
npm run format:web
npm run lint:web
npm run typecheck:web
npm run test:web
npm run build:web
```

Run backend commands from `apps/api`:

```bash
uv sync --frozen
uv run ruff format --check .
uv run ruff check .
uv run mypy
uv run pytest
```

To include the real PostgreSQL readiness test, start PostgreSQL and set
`RUN_DATABASE_INTEGRATION=1` before running Pytest:

```powershell
$env:RUN_DATABASE_INTEGRATION="1"
uv run pytest
```

```bash
RUN_DATABASE_INTEGRATION=1 uv run pytest
```

Ruff can apply Python formatting with `uv run ruff format .`. Prettier is currently enforced as a
check; run `npx prettier --write apps/web` from the repository root to apply frontend formatting.

Useful Docker commands:

```bash
docker compose config --quiet
docker compose up -d postgres
docker compose ps
docker compose logs postgres
docker compose stop postgres
docker compose down
```

`docker compose down` retains the named database volume unless `--volumes` is explicitly supplied.

## Continuous integration

GitHub Actions runs on pull requests and pushes to `main` or `feat/**` branches. The frontend job
uses `npm ci` and checks formatting, linting, types, tests, and the production build. The backend job
uses `uv sync --frozen` and checks Ruff formatting, Ruff linting, mypy, and Pytest against a real
PostgreSQL service container. CI performs no deployment.

## Documentation

- [Authoritative project specification](docs/PROJECT_SPEC.md)
- [Architecture overview](docs/architecture/overview.md)
- [Architecture decisions](docs/decisions/)
- [Deterministic extraction and correction decision](docs/decisions/010-deterministic-skill-extraction-and-manual-correction.md)
- [Foundation API endpoints](docs/api/health.md)
- [Authentication endpoint](docs/api/authentication.md)
- [Local Supabase authentication development](docs/authentication/local-development.md)
- [Milestone 4B manual browser acceptance](docs/testing/milestone-4b-manual-acceptance.md)

## Roadmap

1. Milestone 0: engineering foundation — complete
2. Milestone 1: authentication and ownership foundation — complete
3. Milestone 2: job management — complete
4. Milestone 3: application pipeline and history — complete
5. Milestone 4: deterministic skills engine — 4A complete; 4B implementation complete pending manual acceptance
6. Milestone 5: analytics
7. Milestone 6: polish and v1 release

Later releases may add browser capture, resume intelligence, semantic retrieval, asynchronous
processing, and applied AI, but only after v1 is complete.

## Budget and current limitations

ApplyGauge has a hard **$0 budget**. Local development cannot depend on paid APIs, hosting, storage,
or infrastructure, and core application logic must remain portable if free hosting plans change.

Authentication, manual saved-job CRUD, the application pipeline, canonical skills, deterministic
description extraction, provenance, and durable correction are implemented. Every job starts as
Saved; users can change current status and inspect immutable history. Create and edit forms remain
metadata-only: saving a description performs synchronous backend extraction, while manual skill
management remains on job detail. Job search, filtering, selectable sorting, notes, product
analytics, and deployment automation are not yet implemented.
