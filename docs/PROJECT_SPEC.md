# ApplyGauge — Master Project Specification and Development Instructions

You are helping me design and develop a portfolio-quality full-stack software engineering project called **ApplyGauge**.

Treat this document as the authoritative source of truth for the project unless I explicitly approve a change. Your job is not merely to produce code quickly. Your job is to help me build a clean, maintainable, well-tested, well-documented application while preserving the architecture, product scope, engineering principles, and milestone sequence defined below.

Do not introduce major libraries, services, architectural patterns, infrastructure, AI functionality, or additional product features simply because they seem useful. Avoid unnecessary complexity and scope creep.

When making an implementation decision that is not explicitly specified here:

1. Prefer the simplest maintainable approach.
2. Stay consistent with the architecture described here.
3. Preserve future extensibility.
4. Do not introduce paid dependencies or services.
5. Explain meaningful architectural decisions.
6. If a choice could materially affect later development, identify the tradeoff before committing to it.
7. Do not silently change an existing requirement.
8. Do not implement future-version features during v1 unless I explicitly approve doing so.

---

# 1. PROJECT NAME

The project is called:

**ApplyGauge**

Working description:

> ApplyGauge is a personal job-search intelligence platform that tracks software-engineering opportunities and applications, extracts the technologies employers are asking for, and shows the user what skills appear most frequently across the jobs they are targeting.

Possible tagline:

> Turn your job search into actionable data.

The tagline is not final and should not influence architecture.

---

# 2. WHY THIS PROJECT EXISTS

I am a recent Computer Science graduate building ApplyGauge primarily as a serious software-engineering portfolio project while actively searching for software-engineering jobs.

My existing portfolio already demonstrates experience with:

- Java
- Spring Boot
- Vue
- PostgreSQL
- MongoDB
- Docker
- GitHub Actions
- REST APIs
- OpenAPI
- Flyway
- Python
- Machine Learning
- Speech Processing

My previous significant full-stack work has leaned heavily toward Java and Spring Boot.

One major purpose of ApplyGauge is therefore to broaden my practical experience into a more modern stack that appears frequently in contemporary full-stack/backend engineering positions.

ApplyGauge should provide meaningful hands-on experience with:

- React
- Next.js
- TypeScript
- Python
- FastAPI
- Pydantic
- SQLAlchemy
- PostgreSQL
- authentication
- data modeling
- automated testing
- Docker
- CI/CD
- analytics
- browser-extension integration later
- background processing later
- Redis/Valkey later
- vector search later
- applied AI later

However, these technologies should only be introduced according to the roadmap in this specification.

---

# 3. PERSONAL MOTIVATION

ApplyGauge should solve a problem that I personally experience during my software-engineering job search.

Job-search information is normally fragmented across:

- LinkedIn
- Greenhouse
- Lever
- Ashby
- individual company career pages
- spreadsheets
- notes
- saved bookmarks
- resume versions
- interview records

Traditional application trackers primarily answer:

> Where did I apply?

ApplyGauge should begin answering:

> What am I learning from the jobs I am targeting?

The long-term product vision is to help a job seeker understand:

- which technologies appear most frequently in their target jobs;
- where their personal skill gaps are;
- which portions of their experience match particular requirements;
- whether certain resume versions perform differently;
- how applications progress through the hiring funnel;
- what patterns exist across the user's own job search.

This personal usefulness is important. ApplyGauge should be something I can genuinely use during my own job search rather than a fictional SaaS application built solely for a portfolio.

---

# 4. FINANCIAL CONSTRAINT

This project has a **hard $0 budget**.

I cannot spend money on:

- hosting;
- databases;
- API calls;
- AI model usage;
- cloud infrastructure;
- domains;
- storage;
- paid developer tools;
- paid SaaS products;
- recurring subscriptions.

Do not select a required dependency that requires payment.

Do not design the system around a "free trial" that will eventually require payment.

Avoid infrastructure where entering a credit card could create an accidental bill.

The entire development environment must always be runnable locally for free.

The public portfolio deployment should also remain free if possible.

If a free hosting provider becomes unavailable in the future, the application architecture should be portable enough that deployment can move elsewhere without rewriting core application logic.

---

# 5. PRODUCT PHILOSOPHY

The project should demonstrate:

- thoughtful backend architecture;
- clean API design;
- relational database design;
- strong TypeScript usage;
- strong Python usage;
- authentication and authorization;
- data ownership;
- analytics;
- testing;
- CI/CD;
- maintainability;
- documentation;
- production-oriented engineering practices.

The project should NOT try to look impressive by forcing dozens of technologies into one repository.

Every technology should solve a real problem.

Avoid resume-driven architecture such as introducing Kafka, Kubernetes, microservices, or LLM frameworks simply to list them on a resume.

The goal is:

> Understand a smaller number of technologies deeply and use them appropriately.

---

# 6. PRIMARY USER

Version 1 has exactly one primary persona:

> A software-engineering job seeker who wants to track opportunities/applications and understand which technical skills appear most frequently in the jobs they are pursuing.

Initially, I am the primary user.

Do not design v1 for:

- recruiters;
- employers;
- hiring teams;
- universities;
- career counselors;
- teams;
- companies;
- multi-user workspaces;
- enterprise organizations.

The system supports multiple independent user accounts, but users do not collaborate with each other.

---

# 7. VERSION 1 PRODUCT DEFINITION

ApplyGauge v1 is:

> A personal job-search intelligence platform that allows users to save software-engineering job opportunities, track their application status, automatically detect known technical skills from job descriptions, correct those detected skills, and view aggregate skill-demand analytics across their saved jobs.

This sentence defines v1.

If a proposed feature does not contribute directly to this product definition, it should normally be deferred.

---

# 8. V1 SUCCESS CRITERIA

ApplyGauge v1 is successful when a user can reliably:

1. Create an account.
2. Log in.
3. Log out.
4. Save a job opportunity manually.
5. Store the job's:
   - company;
   - title;
   - description;
   - URL;
   - location;
   - work arrangement;
   - employment type;
   - optional salary information.

6. Automatically detect known technical skills mentioned in the job description.
7. Manually add a missing skill.
8. Remove an incorrectly detected skill.
9. Track the job through an application pipeline.
10. Preserve application-status history.
11. Search saved jobs.
12. Filter saved jobs.
13. Edit a job.
14. Delete a job.
15. Add personal notes to a job.
16. View aggregate technology-demand statistics.
17. See which skills occur most frequently across saved jobs.
18. View basic job-search dashboard metrics.
19. Maintain strict data isolation between different user accounts.
20. Run the entire project locally through documented setup instructions.

If these capabilities are complete, tested, documented, and polished, v1 is finished.

---

# 9. FROZEN V1 TECHNOLOGY STACK

Unless a genuine blocker is discovered and discussed, use the following stack.

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

Use the current stable versions available when bootstrapping the project, unless compatibility requires otherwise.

Do not introduce another major frontend framework.

Do not use Vue in this project.

## Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic

FastAPI owns application business logic.

Pydantic owns request/response validation and API schemas.

SQLAlchemy owns ORM/database access.

Alembic owns schema migrations.

## Database

- PostgreSQL

During deployed usage, Supabase may provide hosted PostgreSQL within its free tier.

The application should remain ordinary PostgreSQL-compatible and should not unnecessarily couple its business logic to proprietary Supabase abstractions.

## Authentication

Use:

- Supabase Auth

v1 authentication method:

- email;
- password.

Do NOT initially add:

- Google OAuth;
- GitHub OAuth;
- LinkedIn OAuth;
- magic links;
- MFA.

The backend must validate authenticated user identity and enforce ownership.

## Testing

Backend:

- Pytest

Frontend:

- Vitest
- React Testing Library

End-to-end:

- Playwright

## Tooling

- Docker
- Docker Compose
- Git
- GitHub
- GitHub Actions

---

# 10. ARCHITECTURAL RULE

Application business logic must flow primarily through:

```text
Next.js / React
       ↓
     FastAPI
       ↓
   PostgreSQL
```

Do not bypass FastAPI for normal application-domain operations merely because Supabase provides generated database APIs.

Supabase is infrastructure.

FastAPI is the application backend.

Examples of business logic that belong in FastAPI include:

- creating jobs;
- modifying jobs;
- ownership validation;
- status transitions;
- skill extraction;
- analytics;
- note management;
- input validation beyond UI concerns.

Authentication may rely on Supabase Auth infrastructure.

---

# 11. REPOSITORY STRATEGY

Use a monorepo.

Target conceptual structure:

```text
applygauge/
│
├── apps/
│   ├── web/
│   │   └── Next.js application
│   │
│   └── api/
│       └── FastAPI application
│
├── packages/
│   └── shared/
│       └── reserved for genuinely shared code/types if useful
│
├── infrastructure/
│   └── docker/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   └── decisions/
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

Do not create empty architecture for its own sake.

For example, `packages/shared` may initially be minimal or absent if nothing legitimately belongs there.

The layout should be easy to extend later with:

```text
apps/
├── web/
├── api/
└── extension/
```

when the browser extension is added.

---

# 12. MAIN V1 APPLICATION NAVIGATION

The primary authenticated application contains these views:

- Dashboard
- Jobs
- Applications
- Insights
- Settings

Jobs and Applications may present different views of the same underlying job/application domain data.

Avoid duplicating database models merely because the UI presents two navigation concepts.

---

# 13. DASHBOARD REQUIREMENTS

Purpose:

> Give the user a quick overview of the current job search.

The dashboard should contain:

## DASH-001

Display total number of saved opportunities.

## DASH-002

Display number of jobs that have reached APPLIED or a later application state.

## DASH-003

Display number of jobs currently in the INTERVIEW state.

## DASH-004

Display application response rate when meaningful data exists.

The precise response-rate definition should be documented before implementation.

Do not invent an ambiguous metric without defining its denominator and numerator.

## DASH-005

Display the top five most frequently detected technical skills across saved jobs.

## DASH-006

Display approximately five recently created or recently updated opportunities.

The dashboard should include sensible:

- empty states;
- loading states;
- error states.

---

# 14. JOB LIST REQUIREMENTS

The Jobs view displays all saved opportunities belonging to the current user.

## JOB-001

View all saved jobs.

## JOB-002

Search by:

- company name;
- job title.

Search should be case-insensitive.

## JOB-003

Filter by application status.

## JOB-004

Sort by creation date.

Additional sorting should not be added unless necessary.

## JOB-005

Selecting a job opens the job detail view.

## JOB-006

Provide a clear way to add a new job.

---

# 15. ADD JOB REQUIREMENTS

v1 uses manual job entry.

Do not implement automated scraping or a browser extension yet.

Form fields:

## Required

- company
- job title
- job description

## Optional

- job URL
- location
- work arrangement
- employment type
- salary minimum
- salary maximum

Do not make optional metadata mandatory simply because it is useful.

The form should remain quick enough that I can realistically use it during a job search.

---

# 16. JOB DETAIL VIEW

The job detail page is the canonical UI representation of one opportunity.

It must display:

- company;
- title;
- current status;
- location;
- work arrangement;
- employment type;
- URL;
- salary data if available;
- original job description;
- detected skills;
- manually added skills;
- status history;
- notes;
- created/updated metadata as appropriate.

Requirements:

## DETAIL-001

Display all persisted job metadata.

## DETAIL-002

Preserve and display the original job description.

Do not destructively rewrite the description during extraction.

## DETAIL-003

Display associated skills.

## DETAIL-004

Allow the user to manually associate an existing skill with the job.

## DETAIL-005

Allow the user to remove a skill association.

## DETAIL-006

Allow valid application-status changes.

## DETAIL-007

Allow creation and management of notes.

## DETAIL-008

Allow editable job metadata.

## DETAIL-009

Allow job deletion with an appropriate confirmation interaction.

---

# 17. APPLICATION STATUS MODEL

Use the following canonical states:

```text
SAVED
APPLIED
SCREENING
INTERVIEW
OFFER
REJECTED
WITHDRAWN
```

Meanings:

## SAVED

The user is interested in the position but has not submitted an application.

## APPLIED

Application has been submitted.

## SCREENING

The user is in an early employer evaluation stage, such as:

- recruiter screen;
- online assessment;
- initial hiring screen.

## INTERVIEW

The user is actively participating in technical, behavioral, hiring-manager, onsite, or equivalent interviews.

## OFFER

An offer has been received.

## REJECTED

The employer rejected the user.

## WITHDRAWN

The user voluntarily stopped pursuing the opportunity.

Do not add separate top-level states for:

- recruiter phone screen;
- OA;
- technical screen;
- onsite;
- final round;
- hiring manager;
- take-home.

Detailed interview-event modeling is deferred to a later version.

---

# 18. STATUS HISTORY

The current status must be stored on the job/application record for efficient access.

However, every status change must also create a historical event.

Example:

```text
SAVED      August 3
APPLIED    August 5
SCREENING  August 10
INTERVIEW  August 14
```

Historical state must not be lost when current status changes.

This history will later support funnel and time-to-stage analytics.

---

# 19. TECHNICAL SKILL EXTRACTION

Skill extraction is a signature v1 feature.

v1 must NOT use an LLM for extraction.

Use deterministic extraction based on a canonical skill catalog plus aliases.

Conceptual pipeline:

```text
job description
      ↓
normalize text
      ↓
compare against known aliases
      ↓
resolve aliases to canonical skills
      ↓
persist job-skill relationships
```

Example source text:

```text
"We are looking for engineers with React.js,
Typescript, Postgres, Docker, and Amazon Web Services."
```

Expected canonical result:

```text
React
TypeScript
PostgreSQL
Docker
AWS
```

Automated detection is not assumed to be perfect.

Important product principle:

> The extraction engine proposes skills. The user controls the final record.

Therefore all detected skills must be editable.

---

# 20. INITIAL SKILL CATALOG

Create a maintainable seed catalog.

Initial categories include at least:

## Languages

- JavaScript
- TypeScript
- Python
- Java
- Go
- Rust
- C
- C++
- C#
- Kotlin
- Swift
- PHP
- Ruby

## Frontend / Frameworks

- React
- Next.js
- Vue
- Angular
- Svelte

## Backend / Frameworks

- FastAPI
- Django
- Flask
- Spring Boot
- Node.js
- Express
- NestJS
- Ruby on Rails
- ASP.NET

## Databases

- PostgreSQL
- MySQL
- SQLite
- MongoDB
- Redis

## Cloud

- AWS
- Azure
- GCP

## DevOps / Infrastructure

- Docker
- Kubernetes
- Terraform
- GitHub Actions
- Jenkins

## Messaging / Distributed Systems

- Kafka
- RabbitMQ

## Testing

Include appropriate commonly requested testing technologies if useful.

This catalog may expand over time, but v1 should not attempt to model every technology in existence.

---

# 21. SKILL ALIASES

Aliases must be stored as data rather than scattered throughout extraction code.

Examples:

Canonical skill:

```text
PostgreSQL
```

Aliases:

```text
postgresql
postgres
psql
```

Canonical:

```text
React
```

Aliases may include:

```text
react
react.js
reactjs
```

Canonical:

```text
AWS
```

Aliases:

```text
aws
amazon web services
```

Avoid overly broad aliases that generate false positives.

For example, do not treat ambiguous short words as technologies without considering word boundaries/context.

The extractor must be deterministic and testable.

---

# 22. INSIGHTS VIEW

This is the main feature differentiating ApplyGauge from an ordinary application tracker.

The user should be able to answer:

> Which technologies appear most frequently in the software jobs I am targeting?

For each skill calculate:

- number of unique saved jobs containing the skill;
- percentage of relevant saved jobs containing the skill.

Formula:

```text
skill_frequency_percentage
=
jobs_containing_skill
/
total_relevant_jobs
×
100
```

Requirements:

## INS-001

Calculate number of jobs associated with each skill.

## INS-002

Calculate the percentage of saved jobs containing each skill.

## INS-003

Sort skills from highest frequency to lowest frequency.

## INS-004

Allow a minimum occurrence threshold where practical.

For example:

```text
Show technologies appearing in at least 3 jobs.
```

## INS-005

Status-filtered insights are desirable but optional for initial v1 completion if they materially complicate delivery.

If deferred, record the item explicitly in the backlog as v1.1 or a minor release enhancement.

## INS-006

Analytics must be computed from database truth.

Do not store redundant percentages that can become stale unless there is a demonstrated performance need.

---

# 23. SETTINGS VIEW

Keep Settings intentionally minimal.

Include:

- basic profile information;
- email display;
- sign out;
- delete account.

Avoid building a complex preferences system.

---

# 24. AUTHENTICATION REQUIREMENTS

Use Supabase Auth for identity.

Required flows:

- sign up;
- sign in;
- sign out;
- persistent authenticated session;
- protected frontend routes;
- authenticated API requests.

FastAPI must validate the authenticated user's identity.

Do not trust a client-supplied `user_id`.

The authenticated user's identity must determine ownership.

---

# 25. DATA ISOLATION

This is non-negotiable.

User A must never be able to:

- retrieve User B's jobs;
- modify User B's jobs;
- retrieve User B's notes;
- modify User B's notes;
- access User B's analytics;
- manipulate IDs to expose User B's data.

Backend authorization must enforce this regardless of frontend behavior.

Every user-owned resource must have clear ownership.

Security must not depend on the frontend simply hiding records.

Tests must verify ownership isolation.

---

# 26. DATABASE MODEL

The initial conceptual model includes:

- users/profile representation as needed;
- companies;
- jobs;
- skills;
- skill_aliases;
- job_skills;
- status_events;
- notes.

Supabase manages authentication identity separately.

Exact schema details may evolve slightly during implementation, but changes should preserve the intent below.

---

# 27. COMPANIES TABLE

Conceptual schema:

```text
companies
────────────────────────

id              UUID PRIMARY KEY
name            VARCHAR NOT NULL
normalized_name VARCHAR NOT NULL
website         VARCHAR NULL
created_at      TIMESTAMP NOT NULL
```

Purpose:

Do not repeatedly duplicate company metadata in every job.

Be thoughtful about company uniqueness.

Since separate users may independently create the same company with different formatting, do not prematurely build a global company-resolution system.

Use normalization where helpful but avoid complex entity matching in v1.

---

# 28. JOBS TABLE

Conceptual schema:

```text
jobs
────────────────────────

id                  UUID PRIMARY KEY
user_id             UUID NOT NULL
company_id          UUID NOT NULL

title               VARCHAR NOT NULL
url                 TEXT NULL
description         TEXT NOT NULL
location            VARCHAR NULL

work_arrangement    ENUM / constrained value
employment_type     ENUM / constrained value

salary_min          INTEGER NULL
salary_max          INTEGER NULL

status              application status NOT NULL

created_at          TIMESTAMP NOT NULL
updated_at          TIMESTAMP NOT NULL
applied_at          TIMESTAMP NULL
```

Consider whether salary requires currency metadata before implementation.

Do not assume every future job is denominated in USD simply because the initial user is in the United States.

If supporting currency in v1 would complicate scope, document a clear assumption rather than creating a half-designed salary model.

---

# 29. WORK ARRANGEMENT VALUES

Use:

```text
REMOTE
HYBRID
ONSITE
UNKNOWN
```

---

# 30. EMPLOYMENT TYPE VALUES

Use:

```text
FULL_TIME
PART_TIME
CONTRACT
INTERNSHIP
UNKNOWN
```

Do not add unnecessary values until required.

---

# 31. SKILLS TABLE

Conceptual schema:

```text
skills
────────────────────────

id          UUID PRIMARY KEY
name        VARCHAR UNIQUE NOT NULL
category    constrained category NOT NULL
created_at  TIMESTAMP NOT NULL
```

Initial categories:

```text
LANGUAGE
FRAMEWORK
DATABASE
CLOUD
DEVOPS
MESSAGING
TESTING
OTHER
```

If categories need modest refinement before schema creation, discuss the reason.

---

# 32. SKILL_ALIASES TABLE

Conceptual schema:

```text
skill_aliases
────────────────────────

id          UUID PRIMARY KEY
skill_id    UUID FOREIGN KEY
alias       VARCHAR NOT NULL
```

Aliases should have appropriate normalization/uniqueness constraints.

---

# 33. JOB_SKILLS TABLE

Many-to-many relationship.

Conceptual schema:

```text
job_skills
────────────────────────

job_id
skill_id
source
created_at
```

Require uniqueness of:

```text
(job_id, skill_id)
```

Initial source values:

```text
DETECTED
MANUAL
```

Design the source representation so a future source such as:

```text
AI
```

could be introduced without a schema redesign.

However, do not implement AI extraction in v1.

---

# 34. STATUS_EVENTS TABLE

Conceptual schema:

```text
status_events
────────────────────────

id
job_id
previous_status
new_status
changed_at
```

Consider whether the initial SAVED state should create an initial event.

Choose one consistent rule and document it.

---

# 35. NOTES TABLE

Conceptual schema:

```text
notes
────────────────────────

id
job_id
user_id
content
created_at
updated_at
```

Use plain text for v1.

Do not introduce rich-text editors.

---

# 36. DATABASE DELETION BEHAVIOR

Deleting a job should permanently delete dependent data such as:

- job_skills;
- status_events;
- notes.

Use appropriate foreign-key cascading behavior where sensible.

Do not implement:

- trash;
- archive;
- restore;
- soft deletion

in v1.

Deletion should require a sensible UI confirmation.

---

# 37. API VERSIONING

All application endpoints should live beneath:

```text
/api/v1/
```

Use consistent REST semantics.

The API should be predictable rather than clever.

---

# 38. CORE API SURFACE

Expected conceptual API:

## Jobs

```http
GET    /api/v1/jobs
POST   /api/v1/jobs

GET    /api/v1/jobs/{job_id}
PATCH  /api/v1/jobs/{job_id}
DELETE /api/v1/jobs/{job_id}
```

The list endpoint should eventually support query parameters for:

- search;
- status;
- sorting;
- pagination if appropriate.

Do not over-engineer pagination before it is needed, but design the API so adding it later is not painful.

## Status

```http
PATCH /api/v1/jobs/{job_id}/status
GET   /api/v1/jobs/{job_id}/status-history
```

## Skills

```http
GET    /api/v1/skills
GET    /api/v1/jobs/{job_id}/skills

POST   /api/v1/jobs/{job_id}/skills/{skill_id}
DELETE /api/v1/jobs/{job_id}/skills/{skill_id}
```

Alternative REST shapes may be considered if they are meaningfully cleaner, but remain consistent.

## Notes

```http
GET    /api/v1/jobs/{job_id}/notes
POST   /api/v1/jobs/{job_id}/notes

PATCH  /api/v1/notes/{note_id}
DELETE /api/v1/notes/{note_id}
```

## Insights

```http
GET /api/v1/insights/skills
GET /api/v1/insights/summary
```

---

# 39. CREATE JOB BEHAVIOR

Example request concept:

```json
{
  "company": "Acme",
  "title": "Software Engineer",
  "url": "https://example.com/jobs/123",
  "location": "San Francisco, CA",
  "work_arrangement": "HYBRID",
  "employment_type": "FULL_TIME",
  "description": "We are seeking..."
}
```

Creating a job should conceptually perform:

```text
validate authenticated user
        ↓
validate request
        ↓
resolve/create company record
        ↓
create job
        ↓
run deterministic skill extraction
        ↓
persist detected job-skill associations
        ↓
return created resource
```

Skill extraction may be implemented synchronously in v1 because it is deterministic and inexpensive.

Do not introduce a worker queue yet.

---

# 40. API ERROR FORMAT

Use a consistent application error format.

Conceptual example:

```json
{
  "error": {
    "code": "JOB_NOT_FOUND",
    "message": "The requested job could not be found."
  }
}
```

Validation-style error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": []
  }
}
```

Do not create wildly different error shapes across endpoints.

Use appropriate HTTP status codes.

Do not leak internal implementation details or stack traces to clients.

---

# 41. INPUT VALIDATION

At minimum:

## Company

- required;
- trim whitespace;
- 1–150 meaningful characters.

## Job title

- required;
- trim whitespace;
- 1–200 meaningful characters.

## Description

- required;
- reject effectively empty content;
- use a modest minimum length such as approximately 20 characters.

Do not require unrealistic job-description length.

## URL

If supplied:

- valid HTTP or HTTPS URL.

## Salary

If minimum and maximum both exist:

```text
salary_min <= salary_max
```

Reject negative values.

## Notes

Set a reasonable maximum length to avoid unbounded payloads.

---

# 42. SECURITY REQUIREMENTS

At minimum:

- validate authentication on protected backend routes;
- scope every query by authenticated user where required;
- never accept arbitrary user ownership from the request body;
- use parameterized ORM/database queries;
- validate URLs and input;
- never expose secrets to the frontend;
- keep `.env` files out of Git;
- provide `.env.example` files;
- avoid logging access tokens or sensitive authentication information;
- configure CORS narrowly rather than using unrestricted production settings;
- use secure production defaults where feasible.

---

# 43. LOCAL DEVELOPMENT REQUIREMENT

The repository must support a clear local setup.

Ideal developer experience:

```text
git clone ...
configure documented environment variables
docker compose up
```

and/or similarly simple documented commands.

The exact Docker strategy should be decided during Milestone 0.

The goal is that a new developer can understand how to launch:

- frontend;
- backend;
- PostgreSQL/local database infrastructure where appropriate.

Because Supabase Auth may introduce external/local configuration considerations, document the development authentication strategy explicitly.

Do not leave local-development behavior ambiguous.

---

# 44. TESTING REQUIREMENTS

Testing is part of the definition of done.

Do not postpone all testing until after implementation.

## Backend — Pytest

Must cover important logic including:

### Authentication / authorization

- unauthenticated access rejected;
- User A cannot retrieve User B's job;
- User A cannot modify User B's job;
- User A cannot delete User B's job;
- notes respect ownership.

### Job CRUD

- valid job creation;
- invalid creation;
- retrieval;
- update;
- delete;
- search;
- filter.

### Status

- valid status update;
- status-history creation;
- relevant timestamp behavior.

### Skill extraction

Must test:

- canonical names;
- aliases;
- case-insensitivity;
- punctuation;
- duplicate aliases;
- word-boundary behavior;
- false-positive-sensitive terms;
- multiple skills in one description.

### Analytics

Seed deterministic data and verify:

- skill counts;
- percentages;
- sorting;
- user isolation.

## Frontend

Use:

- Vitest;
- React Testing Library.

Cover meaningful behavior rather than testing trivial markup.

Examples:

- form validation;
- filtering;
- relevant interactive components;
- empty states;
- error states.

## End-to-End

Use Playwright.

At minimum create a happy-path flow covering:

```text
sign up / log in
      ↓
create job
      ↓
see extracted skills
      ↓
change status
      ↓
view dashboard/insights
```

---

# 45. CI REQUIREMENTS

Use GitHub Actions.

For every pull request / relevant push, eventually run:

## Frontend

- dependency install;
- lint;
- typecheck;
- tests;
- production build.

## Backend

- lint;
- formatting validation where appropriate;
- tests.

## Integration

Where feasible, run database-backed tests in CI.

Do not merge knowingly broken builds.

Avoid excessive CI complexity during Milestone 0; establish a clean foundation and expand checks as components become real.

---

# 46. CODE QUALITY

Prefer:

- explicit types;
- small cohesive modules;
- clear naming;
- separation of concerns;
- dependency injection where it genuinely improves testability;
- service/domain layers only when they create meaningful separation;
- reusable components;
- centralized API client behavior;
- structured configuration;
- migrations for schema changes.

Avoid:

- giant utility files;
- giant React components;
- giant FastAPI route handlers;
- duplicated business logic;
- magic strings;
- hard-coded environment values;
- unnecessary abstractions;
- premature generic repositories;
- gratuitous inheritance;
- excessive design-pattern ceremony.

Do not build "enterprise architecture" merely to look sophisticated.

---

# 47. FRONTEND QUALITY EXPECTATIONS

The UI should feel like a real product rather than a classroom assignment.

Priorities:

- clean;
- restrained;
- professional;
- responsive;
- accessible;
- understandable without explanation.

Every significant page should consider:

- loading state;
- empty state;
- error state;
- successful state.

Forms should:

- provide clear validation feedback;
- prevent duplicate submission;
- preserve useful user input when errors occur.

Tables/lists should remain usable on smaller screens.

Use semantic HTML and accessible form labels.

Do not spend excessive development time building custom visual effects.

---

# 48. DOCUMENTATION REQUIREMENTS

Documentation is part of the portfolio value.

Maintain:

```text
docs/
├── architecture/
│   └── overview.md
│
├── decisions/
│   ├── 001-monorepo.md
│   ├── 002-fastapi.md
│   ├── 003-supabase.md
│   ├── 004-deterministic-skill-extraction.md
│   └── ...
│
└── api/
```

Use Architecture Decision Records for significant decisions.

Each ADR should approximately contain:

```text
Title
Status
Context
Decision
Alternatives Considered
Consequences
```

Example:

## ADR: Deterministic skill extraction for v1

Context:

Skill extraction is required, but ApplyGauge has a $0 budget and should not depend on hosted generative AI.

Decision:

Use a canonical skill catalog and aliases with deterministic text matching.

Reasons:

- free;
- fast;
- deterministic;
- easy to test;
- easy to correct;
- avoids LLM dependency.

Future:

Semantic and AI-assisted classification may supplement deterministic extraction later.

---

# 49. README EXPECTATIONS

The repository README should eventually include:

- project description;
- problem being solved;
- screenshots;
- core features;
- architecture overview;
- technology stack;
- local-development instructions;
- environment configuration;
- test instructions;
- deployment information;
- known limitations;
- roadmap;
- project motivation.

The README should explain engineering decisions rather than serving only as installation documentation.

---

# 50. VERSION ROADMAP

The roadmap is intentionally staged.

Do NOT pull later features into v1 without explicit approval.

## v1 — Core Intelligence

Build:

- authentication;
- manual job capture;
- job CRUD;
- application pipeline;
- status history;
- deterministic skill extraction;
- skill corrections;
- job notes;
- basic dashboard;
- skill-demand analytics;
- testing;
- CI;
- documentation;
- free/local deployment.

## v1.1 — Browser Capture

Add:

- Chrome browser extension;
- Manifest V3;
- authenticated capture;
- page content extraction;
- send captured job data to existing FastAPI API.

Potential target sites eventually include:

- Greenhouse;
- Lever;
- Ashby;
- company career pages.

Do not scrape these in v1.

## v1.2 — Resume Intelligence

Add:

- resume upload;
- resume data model;
- parsed experience evidence;
- user skill profile;
- comparison between personal experience and job-market demand;
- explicit skill-gap identification.

## v1.3 — Semantic Intelligence

Add:

- open-source embedding model;
- pgvector;
- semantic similarity;
- job requirement → resume/project evidence retrieval;
- evidence-grounded matching.

The preferred long-term principle is:

```text
requirement
    ↓
embedding
    ↓
vector retrieval
    ↓
relevant evidence
    ↓
analysis
```

rather than asking a generative model to invent whether experience exists.

## v1.4 — Async Architecture

Add only once real asynchronous work exists:

- Redis or Valkey;
- background worker;
- processing states;
- retry handling;
- job queues.

Potential work:

- embeddings;
- document parsing;
- heavier classification;
- browser-captured job processing.

## v2 — Applied AI

Possible future additions:

- structured LLM extraction;
- requirement classification;
- evidence-grounded job-fit explanations;
- optional local LLMs;
- provider abstraction.

AI should enhance the application rather than become the entire product.

The core product must remain usable without paid AI.

---

# 51. EXPLICITLY OUT OF SCOPE FOR V1

The following are forbidden scope creep unless I explicitly approve a specification change.

## No generative AI

Do not add:

- OpenAI API;
- Anthropic API;
- Gemini API;
- Ollama;
- local LLM;
- AI career coach;
- cover-letter generator;
- resume rewriting;
- chat interface;
- generative job summaries.

## No vector search

Do not add:

- pgvector;
- embeddings;
- semantic retrieval;
- RAG.

These are later roadmap items.

## No browser extension

The extension begins after v1.

Do keep the API architecture compatible with extension clients later.

## No automated job scraping

Do not add:

- LinkedIn scraping;
- Greenhouse scraping;
- Lever scraping;
- Ashby scraping;
- crawlers;
- scheduled scraping;
- background job discovery.

## No email integration

Do not connect Gmail or other email providers.

## No resume parsing

Resume intelligence is later.

## No Redis in v1

Do not add Redis simply because it is on the long-term technology roadmap.

Introduce it when asynchronous processing or caching genuinely requires it.

## No Kafka

Kafka is not currently part of the roadmap.

Do not introduce it.

## No Kubernetes

Do not introduce Kubernetes.

## No microservices

The FastAPI backend should remain a modular monolith.

## No unnecessary Terraform deployment

Terraform may be explored later for a production-style cloud architecture, but it is not a v1 requirement.

## No AWS billable infrastructure

Do not provision:

- ECS;
- RDS;
- ElastiCache;
- EC2;
- managed Kafka;
- other paid AWS resources.

## No social features

No:

- friends;
- sharing;
- comments between users;
- teams;
- organizations;
- recruiters.

---

# 52. FUTURE ARCHITECTURAL DIRECTION

v1:

```text
┌─────────────────────────────┐
│ Next.js                     │
│ React + TypeScript          │
└──────────────┬──────────────┘
               │
               │ HTTPS
               ▼
┌─────────────────────────────┐
│ FastAPI                     │
│ Python                      │
│                             │
│ Auth validation             │
│ Job business logic          │
│ Skill extraction            │
│ Analytics                   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ PostgreSQL                  │
│                             │
│ Companies                   │
│ Jobs                        │
│ Skills                      │
│ Aliases                     │
│ Job skills                  │
│ Status history              │
│ Notes                       │
└─────────────────────────────┘
```

Future evolution:

```text
Browser Extension
        │
        └──────────→ FastAPI

FastAPI
   │
   ▼
Redis / Worker
   │
   ├──────────────→ document processing
   │
   ├──────────────→ embeddings
   │
   └──────────────→ AI analysis
                        │
                        ▼
                     pgvector
```

The v1 architecture should be a foundation, not disposable prototype code.

---

# 53. DEVELOPMENT MILESTONES

Development must proceed in milestones.

Do not jump ahead simply because another feature is interesting.

---

## MILESTONE 0 — ENGINEERING FOUNDATION

Goal:

Create a clean, reproducible development foundation before building product features.

Deliverables:

- Git repository;
- monorepo structure;
- Next.js frontend initialized;
- FastAPI backend initialized;
- environment-variable strategy;
- database strategy;
- Docker configuration;
- Docker Compose where appropriate;
- linting;
- formatting;
- TypeScript configuration;
- Python configuration;
- baseline tests;
- baseline GitHub Actions workflow;
- README skeleton;
- ADR infrastructure;
- health endpoints / connectivity verification.

Acceptance criteria:

A developer can clone the repository, follow documented configuration instructions, and successfully start the frontend and backend.

Frontend can communicate with FastAPI.

FastAPI can communicate with PostgreSQL when database infrastructure is enabled.

Linting/type checks pass.

Baseline tests pass.

CI passes.

Do NOT build job-management functionality during Milestone 0 unless required purely to verify infrastructure.

---

## MILESTONE 1 — AUTHENTICATION

Deliver:

- registration;
- login;
- logout;
- protected UI;
- authentication state;
- authenticated API calls;
- FastAPI token validation;
- data ownership foundation.

Acceptance criteria:

- unauthenticated access to protected resources is rejected;
- logged-in user identity reaches backend securely;
- User A cannot retrieve User B's protected resources in tests.

---

## MILESTONE 2 — JOB MANAGEMENT

Deliver:

- company creation/resolution;
- job creation;
- job listing;
- job detail;
- job editing;
- job deletion;
- search;
- filtering;
- sorting;
- validation;
- UI states.

Acceptance criteria:

I could begin using ApplyGauge instead of a spreadsheet to store target jobs.

---

## MILESTONE 3 — APPLICATION PIPELINE

Deliver:

- canonical statuses;
- status changes;
- status history;
- relevant status timestamps;
- filters;
- status timeline UI.

Acceptance criteria:

A job can progress through:

```text
SAVED
→ APPLIED
→ SCREENING
→ INTERVIEW
→ OFFER
```

and its previous states remain visible.

Terminal outcomes such as REJECTED/WITHDRAWN also work.

---

## MILESTONE 4A — CANONICAL SKILLS AND MANUAL ASSOCIATIONS

Deliver:

- global canonical skill catalog;
- deterministic normalized-term and alias resolution;
- seed mechanism;
- private user/job skill associations;
- manual authenticated association and removal;
- canonical skill display;
- ownership, normalization, persistence, API, and frontend tests.

Acceptance criteria:

An authenticated user can associate curated canonical skills with an owned job, resolve explicit
aliases deterministically, view those canonical skills, and remove associations without exposing
another user's job data.

---

## MILESTONE 4B — DETERMINISTIC SKILL EXTRACTION

Deliver:

- deterministic extractor;
- automatic extraction on job creation;
- MANUAL/DETECTED association provenance;
- automatic handling on description update according to clearly defined behavior;
- preservation of manual corrections and false-positive removals;
- detected skill display and correction behavior;
- extraction tests.

Important design question to resolve before implementation:

When the job description changes, how do previously manually corrected skills behave?

Preferred principle:

- manual user decisions should not be silently destroyed by re-analysis.

Define and document the exact behavior before writing the update algorithm.

Acceptance criteria:

Given a job description mentioning:

```text
React
TypeScript
Postgres
AWS
Docker
```

the appropriate canonical skills are produced reliably.

Aliases and case variations work.

False-positive cases are tested.

Milestone 5 analytics must not begin until Milestone 4B is complete.

---

## MILESTONE 5 — ANALYTICS

Deliver:

- aggregate skill counts;
- percentages;
- ranking;
- top-skill dashboard widget;
- Insights view;
- application summary metrics;
- response-rate definition and calculation;
- deterministic analytics tests.

Acceptance criteria:

Given seeded test data, expected aggregate values are exact and automated tests verify them.

---

## MILESTONE 6 — POLISH AND V1 RELEASE

Deliver:

- responsive UI;
- accessibility pass;
- loading states;
- error states;
- empty states;
- destructive-action confirmations;
- complete tests;
- Playwright happy path;
- CI hardening;
- README;
- architecture diagram;
- ADRs;
- demo/seed strategy;
- local setup documentation;
- free public deployment if practical.

Acceptance criteria:

Someone unfamiliar with the repository can:

1. understand the product;
2. run it;
3. understand its architecture;
4. see automated testing;
5. use the core product without my assistance.

Then tag:

```text
v1.0.0
```

Do not continue adding features before acknowledging v1 completion.

---

# 54. V1 DEFINITION OF DONE

Do not declare v1 complete until:

- authentication works;
- protected routes work;
- user data is isolated;
- jobs can be created;
- jobs can be viewed;
- jobs can be edited;
- jobs can be deleted;
- jobs can be searched;
- jobs can be filtered;
- application status can change;
- status history is persisted;
- job descriptions remain intact;
- known skills are automatically detected;
- manual corrections are supported;
- skill counts are accurate;
- skill percentages are accurate;
- Insights works;
- dashboard works;
- notes work;
- backend critical logic has automated tests;
- important frontend behavior has tests;
- E2E happy path passes;
- CI passes;
- local environment is documented;
- project remains $0 to develop;
- README is polished;
- architecture is documented;
- significant decisions have ADRs.

---

# 55. CHANGE CONTROL RULE

Whenever a new idea appears, evaluate it using:

> Is this necessary to satisfy the v1 success criteria?

If yes:

Explain why the requirement needs to change and update the specification deliberately.

If no:

Add it to a backlog/future-version note and continue the current milestone.

Do not spontaneously implement the feature.

This rule is extremely important.

I want to avoid a development process where:

```text
"It would be cool if..."
```

repeatedly expands the project.

---

# 56. HOW I WANT YOU TO WORK WITH ME

I am developing this project in VS Code with Codex as an engineering assistant.

I want to understand what I am building.

Do not treat me like someone who merely wants generated code pasted into a repository.

When implementing meaningful features:

1. Explain the purpose of the change.
2. Identify which files/components are affected.
3. Explain architectural choices that matter.
4. Implement the change cleanly.
5. Add or update tests.
6. Run appropriate checks.
7. Report what passed or failed.
8. Update documentation when the design changes.
9. Identify technical debt rather than hiding it.

When debugging:

1. Reproduce or understand the actual failure.
2. Identify root cause.
3. Avoid unrelated rewrites.
4. Fix the smallest correct scope.
5. Add a regression test when appropriate.

When refactoring:

1. Explain why the refactor is needed.
2. Preserve observable behavior unless a behavior change is explicitly intended.
3. Keep tests passing.

---

# 57. DO NOT OVERWRITE WORK CARELESSLY

Before modifying existing code:

- inspect current implementation;
- understand current architecture;
- preserve intentional behavior;
- avoid deleting working functionality unless necessary.

Do not replace entire files unnecessarily when a focused edit is sufficient.

Do not undo previous architectural decisions without identifying the conflict.

---

# 58. DEPENDENCY POLICY

Before adding a dependency, ask internally:

1. What problem does this solve?
2. Can existing dependencies already solve it?
3. Is it maintained?
4. Is it free/open-source?
5. Does it significantly increase complexity?
6. Is it appropriate for v1?

Do not add large libraries for tiny conveniences.

Keep frontend and backend dependencies intentional.

Pin or lock versions appropriately using the ecosystem's standard lockfile mechanisms.

---

# 59. DATA MIGRATION POLICY

Once persistent schema exists:

- use Alembic migrations;
- do not manually mutate production/shared database schemas outside migrations;
- keep migrations deterministic;
- review destructive migrations carefully.

Seed data should be separate from migrations unless it represents required canonical application data such as initial skill definitions and there is a clear strategy for maintaining it.

---

# 60. SKILL CATALOG MAINTENANCE

The skill catalog is important domain data.

Design it so:

- skills have canonical names;
- aliases map to canonical names;
- extraction behavior is testable;
- catalog updates do not require editing extraction algorithms;
- duplicates are prevented;
- capitalization/display formatting remains consistent.

Avoid embedding an enormous hard-coded dictionary in one Python function.

---

# 61. ANALYTICS PRINCIPLES

Analytics must be explainable.

For every displayed metric, it should be possible to answer:

- what data contributes to it;
- what the denominator is;
- what the numerator is;
- what statuses are included;
- whether deleted jobs disappear;
- whether manual and detected skills are treated the same.

Do not show vague "scores" without defined meaning.

This principle becomes even more important when AI is added later.

---

# 62. FUTURE AI PRINCIPLE

When AI eventually enters the product:

> AI should analyze evidence, not invent evidence.

For example, future job matching should prefer:

```text
job requirement
      ↓
retrieve relevant resume/project evidence
      ↓
analyze evidence
      ↓
show explanation
```

rather than:

```text
send entire resume + job posting
      ↓
mysterious 82% match score
```

Explainability and provenance should be preferred.

This is future guidance only.

Do not implement AI during v1.

---

# 63. PORTFOLIO QUALITY

Remember that this repository will be reviewed by potential employers.

The finished project should demonstrate that I understand:

- why the architecture exists;
- why FastAPI was chosen;
- why PostgreSQL was chosen;
- why deterministic extraction came before AI;
- how authentication is validated;
- how authorization is enforced;
- how relational data is modeled;
- how analytics are calculated;
- how tests are structured;
- how CI works;
- how local/deployed environments differ;
- what tradeoffs the $0 constraint introduced.

Readable architecture and thoughtful tradeoffs are more valuable than inflated technological complexity.

---

# 64. ZERO-DOLLAR DEPLOYMENT PHILOSOPHY

Potential free providers may include tools such as:

- Supabase;
- Vercel;
- other genuinely free hosting services available at deployment time.

However, do not tightly couple core code to today's hosting provider.

Free plans change.

The application must remain locally runnable.

Conceptually distinguish:

```text
Development
    ↓
local / Docker

Portfolio Demo
    ↓
free managed services

Hypothetical Production
    ↓
more robust cloud architecture if resources justified it
```

We may later document a hypothetical AWS/Terraform production architecture without provisioning billable resources.

Do not introduce AWS simply to create resume keywords.

---

# 65. CURRENT PRIORITY

We are currently at the beginning of development.

The next task is **Milestone 0 only**.

Do not start building:

- job CRUD;
- skill extraction;
- analytics;
- browser extensions;
- AI features.

First help establish the engineering foundation.

Before making substantial changes, inspect the repository if it already contains files.

If the repository is empty, propose and then establish the cleanest Milestone 0 structure consistent with this specification.

Milestone 0 should resolve and document:

1. exact monorepo layout;
2. Next.js initialization;
3. FastAPI initialization;
4. Python dependency/package-management strategy;
5. Node package-management strategy;
6. environment-variable organization;
7. local PostgreSQL strategy;
8. Supabase integration boundary;
9. local authentication-development approach;
10. Docker / Docker Compose strategy;
11. frontend linting/formatting;
12. backend linting/formatting;
13. TypeScript strictness;
14. Python typing;
15. health endpoints;
16. frontend-to-backend connectivity;
17. baseline tests;
18. baseline GitHub Actions CI;
19. README skeleton;
20. architecture documentation structure;
21. first ADRs;
22. `.env.example`;
23. `.gitignore`;
24. developer startup commands.

Do not overbuild Milestone 0.

The goal is a boring, reliable foundation.

---

# 66. BEFORE WRITING CODE

For the first interaction after receiving this specification:

1. Read this entire specification.
2. Inspect the current repository.
3. Summarize your understanding of ApplyGauge in your own words.
4. Identify any concrete inconsistencies in the specification that must be resolved before Milestone 0.
5. Do not invent questions for choices that can reasonably be resolved using the principles above.
6. Propose the exact Milestone 0 implementation plan.
7. Identify the files/directories you intend to create.
8. Identify the development tools/dependencies you intend to introduce and explain why each is needed.
9. Explicitly confirm that your proposed work does not introduce any v1.1+ features.
10. Explicitly confirm that all proposed required technologies can be used without paid services.

Then proceed through Milestone 0 methodically.

---

# 67. CORE PROJECT PRINCIPLE

When in doubt, optimize for:

> A finished, polished, deeply understood system with justified architecture.

Do not optimize for:

> The maximum number of technologies listed on a resume.

ApplyGauge should become progressively more sophisticated because real product requirements create new engineering problems.

The intended progression is:

```text
reliable core application
        ↓
browser capture
        ↓
resume intelligence
        ↓
semantic retrieval
        ↓
background processing
        ↓
applied AI
```

Each stage should exist because the previous stage creates a genuine reason for it.

That is the central engineering philosophy of this project.
