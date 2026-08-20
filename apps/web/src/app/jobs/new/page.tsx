import Link from "next/link";

import { createJobAction } from "@/app/jobs/actions";
import { JobForm } from "@/components/jobs/job-form";
import { JobsShell } from "@/components/jobs/jobs-shell";
import { requireAuthenticatedApiSession } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  await requireAuthenticatedApiSession();
  return (
    <JobsShell
      description="Save an opportunity and keep its details in one focused workspace."
      title="Add opportunity"
    >
      <Link
        className="focus-ring inline-block rounded-sm text-sm font-semibold text-brand hover:text-brand-hover hover:underline"
        href="/jobs"
      >
        ← Back to saved jobs
      </Link>
      <div className="mt-6">
        <JobForm action={createJobAction} cancelHref="/jobs" />
      </div>
    </JobsShell>
  );
}
