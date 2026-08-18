import Link from "next/link";

import { type JobRead } from "@/lib/api/jobs";
import {
  employmentTypeLabel,
  formatJobDate,
  workArrangementLabel,
} from "@/lib/jobs/presentation";

export function JobSummary({ job }: { job: JobRead }) {
  return (
    <Link
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      href={`/jobs/${job.id}`}
    >
      <h3 className="text-xl font-semibold text-slate-950">{job.title}</h3>
      <p className="mt-1 font-medium text-slate-700">{job.company.name}</p>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
        {job.location ? <span>{job.location}</span> : null}
        <span>{workArrangementLabel(job.work_arrangement)}</span>
        <span>{employmentTypeLabel(job.employment_type)}</span>
        <span>Saved {formatJobDate(job.created_at)}</span>
      </div>
    </Link>
  );
}
