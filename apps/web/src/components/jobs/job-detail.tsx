import Link from "next/link";

import { DeleteJobButton } from "@/components/jobs/delete-job-button";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { JobStatusControl } from "@/components/jobs/job-status-control";
import { JobSkills } from "@/components/jobs/job-skills";
import { StatusHistory } from "@/components/jobs/status-history";
import {
  type JobRead,
  type SkillRead,
  type StatusEventRead,
} from "@/lib/api/jobs";
import {
  type SkillActionState,
  type StatusActionState,
} from "@/app/jobs/actions";
import { type JobActionState } from "@/lib/jobs/form";
import {
  employmentTypeLabel,
  formatJobDateTime,
  workArrangementLabel,
} from "@/lib/jobs/presentation";

export function JobDetail({
  addSkillAction,
  deleteAction,
  history,
  job,
  removeSkillAction,
  skills,
  statusAction,
}: {
  addSkillAction: (name: string) => Promise<SkillActionState>;
  deleteAction: () => Promise<JobActionState>;
  history: StatusEventRead[] | null;
  job: JobRead;
  removeSkillAction: (skillId: string) => Promise<SkillActionState>;
  skills: SkillRead[] | null;
  statusAction: (status: string) => Promise<StatusActionState>;
}) {
  return (
    <article>
      <header>
        <p className="break-words font-semibold text-brand">
          {job.company.name}
        </p>
        <h2 className="mt-2 max-w-3xl break-words text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {job.title}
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <JobStatusBadge status={job.current_status} />
          <Link
            className="focus-ring inline-flex min-h-9 items-center rounded-md px-3 text-sm font-semibold text-brand hover:bg-indigo-50 hover:text-brand-hover"
            href={`/jobs/${job.id}/edit`}
          >
            Edit
          </Link>
        </div>
      </header>

      <dl className="mt-7 grid gap-x-8 gap-y-5 border-y border-line py-6 sm:grid-cols-2 lg:grid-cols-3">
        {job.location ? (
          <DetailItem label="Location" value={job.location} />
        ) : null}
        <DetailItem
          label="Work arrangement"
          value={workArrangementLabel(job.work_arrangement)}
        />
        <DetailItem
          label="Employment type"
          value={employmentTypeLabel(job.employment_type)}
        />
        <DetailItem label="Saved" value={formatJobDateTime(job.created_at)} />
        <DetailItem
          label="Last updated"
          value={formatJobDateTime(job.updated_at)}
        />
        {job.job_url ? (
          <div className="min-w-0">
            <dt className="text-sm font-medium text-muted">Original posting</dt>
            <dd className="mt-1 break-words">
              <a
                className="focus-ring rounded-sm font-semibold text-brand hover:text-brand-hover hover:underline"
                href={job.job_url}
                rel="noopener noreferrer"
                target="_blank"
              >
                View job posting (opens in a new tab)
              </a>
            </dd>
          </div>
        ) : null}
      </dl>

      <section className="mt-8" aria-labelledby="application-status-heading">
        <h3
          className="text-xl font-semibold text-ink"
          id="application-status-heading"
        >
          Application status
        </h3>
        <p className="mt-1 text-sm text-muted">
          Update the current stage while preserving its history.
        </p>
        <div className="mt-4 max-w-xl">
          <JobStatusControl
            action={statusAction}
            currentStatus={job.current_status}
            key={job.current_status}
          />
        </div>
      </section>

      <JobSkills
        addAction={addSkillAction}
        removeAction={removeSkillAction}
        skills={skills}
      />

      <section
        className="mt-10 border-t border-line pt-8"
        aria-labelledby="description-heading"
      >
        <h3 className="text-xl font-semibold text-ink" id="description-heading">
          Description
        </h3>
        {job.description ? (
          <p className="mt-3 max-w-3xl break-words whitespace-pre-wrap leading-7 text-ink/80">
            {job.description}
          </p>
        ) : (
          <p className="mt-3 text-muted">
            No description was saved for this job.
          </p>
        )}
      </section>

      <StatusHistory events={history} />

      <section
        className="mt-10 border-t border-line pt-8"
        aria-labelledby="delete-opportunity-heading"
      >
        <h3
          className="text-base font-semibold text-ink"
          id="delete-opportunity-heading"
        >
          Delete this opportunity
        </h3>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Permanently removes this opportunity and its associated history and
          skills.
        </p>
        <div className="mt-3">
          <DeleteJobButton action={deleteAction} />
        </div>
      </section>
    </article>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className="mt-1 break-words text-ink">{value}</dd>
    </div>
  );
}
