import Link from "next/link";
import { notFound } from "next/navigation";

import { updateJobAction } from "@/app/jobs/actions";
import { JobForm } from "@/components/jobs/job-form";
import { JobsShell } from "@/components/jobs/jobs-shell";
import { Alert } from "@/components/ui/alert";
import { ApiError } from "@/lib/api";
import { getJob } from "@/lib/api/jobs";
import { requireAuthenticatedApiSession } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const getAccessToken = await requireAuthenticatedApiSession();
  let job;
  try {
    job = await getJob(jobId, getAccessToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return (
      <JobsShell>
        <Alert title="Opportunity unavailable">
          This job could not be loaded right now. Please try again later.
        </Alert>
      </JobsShell>
    );
  }
  const action = updateJobAction.bind(null, jobId);
  return (
    <JobsShell
      description="Update the saved details for this opportunity."
      title="Edit opportunity"
    >
      <Link
        className="focus-ring inline-block rounded-sm text-sm font-semibold text-brand hover:text-brand-hover hover:underline"
        href={`/jobs/${jobId}`}
      >
        ← Back to job details
      </Link>
      <div className="mt-6">
        <JobForm action={action} cancelHref={`/jobs/${jobId}`} job={job} />
      </div>
    </JobsShell>
  );
}
