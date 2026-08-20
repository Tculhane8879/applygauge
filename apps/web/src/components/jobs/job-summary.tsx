import Link from "next/link";

import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { type JobRead } from "@/lib/api/jobs";
import {
  employmentTypeLabel,
  formatJobDate,
  workArrangementLabel,
} from "@/lib/jobs/presentation";

export function JobSummary({ job }: { job: JobRead }) {
  return (
    <Link
      className="focus-ring grid gap-4 p-4 transition-colors hover:bg-surface-muted sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5"
      href={`/jobs/${job.id}`}
    >
      <div className="min-w-0">
        <h3 className="break-words text-lg font-semibold text-ink">
          {job.title}
        </h3>
        <p className="mt-1 break-words font-medium text-ink/75">
          {job.company.name}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          {job.location ? (
            <span className="break-words">{job.location}</span>
          ) : null}
          <span>{workArrangementLabel(job.work_arrangement)}</span>
          <span>{employmentTypeLabel(job.employment_type)}</span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
        <JobStatusBadge status={job.current_status} />
        <span className="text-sm text-muted">
          Tracked {formatJobDate(job.created_at)}
        </span>
      </div>
    </Link>
  );
}
