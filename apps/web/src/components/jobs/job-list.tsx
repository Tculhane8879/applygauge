import { type JobRead } from "@/lib/api/jobs";
import { EmptyState } from "@/components/ui/empty-state";

import { JobSummary } from "./job-summary";

export function JobList({ jobs }: { jobs: JobRead[] }) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        description="Add your first opportunity to begin building your saved-job list."
        title="No saved jobs yet"
      />
    );
  }

  return (
    <section aria-labelledby="job-list-heading">
      <h2 className="sr-only" id="job-list-heading">
        Saved job opportunities
      </h2>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {jobs.map((job) => (
          <li key={job.id}>
            <JobSummary job={job} />
          </li>
        ))}
      </ul>
    </section>
  );
}
