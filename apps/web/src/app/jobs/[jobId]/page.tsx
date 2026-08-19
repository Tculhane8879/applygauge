import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addJobSkillAction,
  deleteJobAction,
  removeJobSkillAction,
  updateJobStatusAction,
} from "@/app/jobs/actions";
import { JobDetail } from "@/components/jobs/job-detail";
import { JobsShell } from "@/components/jobs/jobs-shell";
import { ApiError } from "@/lib/api";
import { getJob, getJobSkills, getStatusEvents } from "@/lib/api/jobs";
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
          addSkillAction={addJobSkillAction.bind(null, jobId)}
          deleteAction={deleteJobAction.bind(null, jobId)}
          history={result.history}
          job={result.job}
          removeSkillAction={removeJobSkillAction.bind(null, jobId)}
          skills={result.skills}
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
    const [jobResult, historyResult, skillsResult] = await Promise.allSettled([
      getJob(jobId, getAccessToken),
      getStatusEvents(jobId, getAccessToken),
      getJobSkills(jobId, getAccessToken),
    ]);
    if (jobResult.status === "rejected") throw jobResult.reason;
    let history = null;
    if (historyResult.status === "rejected") {
      if (
        historyResult.reason instanceof ApiError &&
        historyResult.reason.status === 404
      ) {
        throw historyResult.reason;
      }
    } else {
      history = historyResult.value.items;
    }
    let skills = null;
    if (skillsResult.status === "rejected") {
      if (
        skillsResult.reason instanceof ApiError &&
        skillsResult.reason.status === 404
      ) {
        throw skillsResult.reason;
      }
    } else {
      skills = skillsResult.value.items;
    }
    return {
      ok: true as const,
      job: jobResult.value,
      history,
      skills,
    };
  } catch (error: unknown) {
    return {
      ok: false as const,
      status: error instanceof ApiError ? error.status : null,
    };
  }
}
