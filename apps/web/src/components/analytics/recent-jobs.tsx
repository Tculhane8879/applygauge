import Link from "next/link";

import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { type RecentJobRead } from "@/lib/api/analytics";
import { formatJobDate } from "@/lib/jobs/presentation";

export function RecentJobs({ jobs }: { jobs: RecentJobRead[] }) {
  return (
    <section aria-labelledby="recent-jobs-heading">
      <h2 className="mb-4 text-xl font-bold text-ink" id="recent-jobs-heading">
        Recent opportunities
      </h2>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {jobs.map((job) => (
          <li className="p-4" key={job.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  className="focus-ring break-words rounded-sm font-semibold text-ink hover:text-brand hover:underline"
                  href={`/jobs/${encodeURIComponent(job.id)}`}
                >
                  {job.title}
                </Link>
                <p className="mt-1 break-words text-sm text-muted">
                  {job.company_name}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Tracked {formatJobDate(job.created_at)}
                </p>
              </div>
              <JobStatusBadge status={job.current_status} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
