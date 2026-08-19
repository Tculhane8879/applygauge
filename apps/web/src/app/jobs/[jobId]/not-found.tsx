import Link from "next/link";

import { JobsShell } from "@/components/jobs/jobs-shell";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function JobNotFound() {
  return (
    <JobsShell>
      <EmptyState
        action={
          <Link className={buttonStyles({ variant: "secondary" })} href="/jobs">
            Return to saved jobs
          </Link>
        }
        description="This saved job is unavailable or does not exist."
        title="Job not found"
      />
    </JobsShell>
  );
}
