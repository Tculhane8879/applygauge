import Link from "next/link";

import { createJobAction } from "@/app/jobs/actions";
import { JobForm } from "@/components/jobs/job-form";
import { JobsShell } from "@/components/jobs/jobs-shell";
import { requireAuthenticatedApiSession } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  await requireAuthenticatedApiSession();
  return (
    <JobsShell>
      <Link className="font-medium text-blue-700 hover:underline" href="/jobs">
        ← Back to saved jobs
      </Link>
      <h2 className="mt-6 text-3xl font-bold text-slate-950">Add a job</h2>
      <p className="mt-2 text-slate-600">
        Save an opportunity for later review.
      </p>
      <div className="mt-8">
        <JobForm action={createJobAction} cancelHref="/jobs" />
      </div>
    </JobsShell>
  );
}
