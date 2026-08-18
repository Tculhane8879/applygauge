import { type JobRead } from "@/lib/api/jobs";

import { JobSummary } from "./job-summary";

export function JobList({ jobs }: { jobs: JobRead[] }) {
  if (jobs.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-xl font-semibold">No saved jobs yet</h2>
        <p className="mt-2 text-slate-600">
          Add your first opportunity to begin building your saved-job list.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="job-list-heading">
      <h2 className="sr-only" id="job-list-heading">
        Saved job opportunities
      </h2>
      <ul className="space-y-4">
        {jobs.map((job) => (
          <li key={job.id}>
            <JobSummary job={job} />
          </li>
        ))}
      </ul>
    </section>
  );
}
