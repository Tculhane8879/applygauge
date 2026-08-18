import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteJobAction, updateJobStatusAction } from "@/app/jobs/actions";
import { JobDetail } from "@/components/jobs/job-detail";
import { JobsShell } from "@/components/jobs/jobs-shell";
import { ApiError } from "@/lib/api";
import { getJob, getStatusEvents } from "@/lib/api/jobs";
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
          history={result.history}
          job={result.job}
          statusAction={updateJobStatusAction.bind(null, jobId)}
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
    const [jobResult, historyResult] = await Promise.allSettled([
      getJob(jobId, getAccessToken),
      getStatusEvents(jobId, getAccessToken),
    ]);
    if (jobResult.status === "rejected") throw jobResult.reason;
    if (historyResult.status === "rejected") {
      if (
        historyResult.reason instanceof ApiError &&
        historyResult.reason.status === 404
      ) {
        throw historyResult.reason;
      }
      return { ok: true as const, job: jobResult.value, history: null };
    }
    return {
      ok: true as const,
      job: jobResult.value,
      history: historyResult.value.items,
    };
  } catch (error: unknown) {
    return {
      ok: false as const,
      status: error instanceof ApiError ? error.status : null,
    };
  }
}
