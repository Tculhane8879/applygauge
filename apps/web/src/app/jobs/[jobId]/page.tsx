import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteJobAction } from "@/app/jobs/actions";
import { JobDetail } from "@/components/jobs/job-detail";
import { JobsShell } from "@/components/jobs/jobs-shell";
import { ApiError } from "@/lib/api";
import { getJob } from "@/lib/api/jobs";
import { requireAuthenticatedApiSession } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const getAccessToken = await requireAuthenticatedApiSession();
  const result = await loadJob(jobId, getAccessToken);

  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <JobsShell>
        <p className="rounded-xl bg-red-50 p-4 text-red-800" role="alert">
          This job could not be loaded right now. Please try again later.
        </p>
      </JobsShell>
    );
  }

  return (
    <JobsShell>
      <Link className="font-medium text-blue-700 hover:underline" href="/jobs">
        ← Back to saved jobs
      </Link>
      <div className="mt-6">
        <JobDetail
          deleteAction={deleteJobAction.bind(null, jobId)}
          job={result.job}
        />
      </div>
    </JobsShell>
  );
}

async function loadJob(
  jobId: string,
  getAccessToken: Awaited<ReturnType<typeof requireAuthenticatedApiSession>>,
) {
  try {
    return { ok: true as const, job: await getJob(jobId, getAccessToken) };
  } catch (error) {
    return {
      ok: false as const,
      status: error instanceof ApiError ? error.status : null,
    };
  }
}
