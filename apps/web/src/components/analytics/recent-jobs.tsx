import Link from "next/link";

import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { type RecentJobRead } from "@/lib/api/analytics";
import { formatJobDate } from "@/lib/jobs/presentation";

export function RecentJobs({ jobs }: { jobs: RecentJobRead[] }) {
  return (
    <section aria-labelledby="recent-jobs-heading">
      <h2 className="mb-4 text-xl font-bold" id="recent-jobs-heading">
        Recent opportunities
      </h2>
      <ul className="space-y-3">
        {jobs.map((job) => (
          <li
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            key={job.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  className="font-semibold text-blue-800 hover:underline"
                  href={`/jobs/${encodeURIComponent(job.id)}`}
                >
                  {job.title}
                </Link>
                <p className="mt-1 text-sm text-slate-600">
                  {job.company_name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
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
