# ADR 010: Deterministic Skill Extraction and Manual Correction

## Status

Accepted — Milestone 4B

## Context

ApplyGauge needs structured skills from saved job descriptions without probabilistic NLP or AI.
The existing global `Skill` identities, canonical and alias `SkillTerm` rows, and private
user-owned job-skill associations provide stable vocabulary and ownership boundaries. Automatic
detection must remain deterministic while preserving explicit user intent when descriptions
change or users correct false positives.

## Decision

### Explicit extraction eligibility

`skill_terms.is_extractable` separates manual lookup eligibility from prose-extraction
eligibility. Only explicitly reviewed, migration-backed terms participate in extraction. The
current policy enables 34 of 38 terms; `C`, `JS`, `TS`, and `Node` remain manual-only because these
short forms are ambiguous in prose. New catalog terms are not extractable automatically.

### Association provenance

`job_skills.is_manual` and `job_skills.is_detected` represent manual-only, detected-only, and
manual-plus-detected states. `CHECK(is_manual OR is_detected)` prevents a visible association with
no provenance, while the existing composite primary key retains one visible row per job and skill.
A single source column was rejected because manual and detected intent can coexist. A separate
normalized provenance table was rejected as unnecessary for two fixed, non-historical flags.

### Durable manual correction

`job_skill_suppressions` means: do not automatically associate this skill with this job unless the
user manually adds it again. Removing detected-only or dual skills creates suppression; removing a
manual-only skill does not. Suppression persists across matching and nonmatching description
changes, is respected by later detection, and is cleared by explicit manual POST. Suppressions are
private implementation state and are absent from public API and UI responses. This prevents a
known false positive from immediately returning after the next description edit.

PostgreSQL does not directly exclude the same job and skill from both `job_skills` and
`job_skill_suppressions`. Application services maintain that cross-table invariant transactionally
while holding the owned job-row lock; no database trigger or cross-table constraint is claimed.

### Deterministic extractor

The pure extractor applies Unicode NFKC and case folding to descriptions, escapes catalog terms as
literals, permits flexible whitespace within multiword terms, and uses Unicode-aware word
boundaries. Conservative right-side punctuation guards prevent extended `C++` and `C#` tokens from
matching. Longer candidates win overlapping spans, canonical skill IDs are deduplicated, and
results use deterministic UUID ordering.

These rules distinguish `Java` from the overlapping `JavaScript`, avoid matching `SQL` inside
`NoSQL`, and treat `.NET`, `Node.js`, `Next.js`, `C#`, and `C++` as punctuation-sensitive literals.
The ambiguous `Node` shorthand is manual-only while `Node.js` and reviewed aliases remain
extractable. There is no fuzzy matching, stemming, semantic classification, embedding, NLP, or AI.

### Synchronous atomic extraction

Extraction runs synchronously during job creation and when PATCH explicitly changes a description.
There is no extraction endpoint, queue, worker, or background job. Job metadata, initial status
creation when applicable, and skill reconciliation commit atomically. Unexpected extraction or
reconciliation failure rolls back the entire domain mutation.

A newly inserted job is already transaction-owned and needs no redundant row lock. Every mutation
of skill state for an existing job first locks the owned job row with `SELECT ... FOR UPDATE`.
Manual add, manual remove, description reconciliation, suppression changes, and concurrent
description updates therefore share one serialization point. Status changes intentionally use the
same job-row locking strategy and may serialize with skill mutations.

### Description and reconciliation behavior

An omitted description does not run extraction. A supplied but unchanged description does not load
terms or reconcile. Clearing a description removes detected-only associations, downgrades dual
associations to manual-only, preserves manual-only associations, and preserves suppressions.

The effective detected set is `matched - suppressed`. Reconciliation is:

- effective plus absent: create detected-only;
- effective plus manual-only: update to dual;
- effective plus detected-only or dual: no change;
- no longer effective plus detected-only: delete;
- no longer effective plus dual: update to manual-only;
- manual-only: no change.

Updates preserve `created_at` whenever the visible association row remains.

### Manual operations

Manual POST locks and authorizes the job before resolving the term, clears matching suppression,
and establishes manual intent without rerunning extraction. An absent association becomes
manual-only and returns `201`; a suppressed absent association does the same after suppression is
removed. Detected-only becomes dual and returns `200`; manual-only and dual remain visible and
return `200`.

Manual DELETE removes manual-only without suppression. Removing detected-only or dual deletes the
visible association and creates suppression. An absent association or unknown UUID returns `204`
without a catalog query or suppression, preserving catalog nondisclosure. Missing and non-owned
jobs retain the same nondisclosing `404`.

### Public provenance

`SkillRead.sources` exposes only `MANUAL` and `DETECTED`, ordered manual before detected. The API
does not expose storage booleans, suppressions, matched terms, aliases, confidence, or provenance
timestamps. The job detail UI renders `Manual`, `Detected`, or `Manual + detected` and retains one
ordinary Remove action for every visible skill.

## Alternatives Considered

- Extract every accepted alias: rejected because short ambiguous terms create avoidable false positives.
- A single provenance enum: rejected because manual and detected provenance can coexist.
- A normalized provenance table: rejected because two fixed flags do not justify another join or history model.
- Delete-only correction: rejected because detected false positives would return on later reconciliation.
- Database triggers for association/suppression exclusion: rejected in favor of one explicit,
  transactionally locked application boundary.
- Asynchronous extraction: rejected because the catalog is tiny and atomic immediate results are useful.
- Fuzzy, NLP, embedding, or AI extraction: rejected because v1 requires explainable deterministic behavior.

## Consequences

- Extraction intentionally favors precision over recall; excluded shorthand can create false negatives.
- Extraction-safe catalog additions and aliases require reviewed migrations.
- Suppression rows may accumulate, but retain durable user corrections.
- One job-row lock serializes same-job mutations and adds a small synchronous transaction cost.
- There is no extraction history, confidence, or match explanation.
- Canonical associations and provenance provide a stable basis for future analytics without
  deciding Milestone 5 calculations here.
