import { JobList } from "@/components/jobs/job-list";
import { JobsShell } from "@/components/jobs/jobs-shell";
import { getJobs } from "@/lib/api/jobs";
import { requireAuthenticatedApiSession } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const getAccessToken = await requireAuthenticatedApiSession();
  const result = await loadJobs(getAccessToken);

  if (!result.ok) {
    return (
      <JobsShell>
        <p className="rounded-xl bg-red-50 p-4 text-red-800" role="alert">
          Saved jobs could not be loaded right now. Please try again later.
        </p>
      </JobsShell>
    );
  }

  return (
    <JobsShell>
      <div className="mb-6 flex justify-end">
        <Link
          className="rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white"
          href="/jobs/new"
        >
          Add job
        </Link>
      </div>
      <JobList jobs={result.items} />
    </JobsShell>
  );
}

async function loadJobs(
  getAccessToken: Awaited<ReturnType<typeof requireAuthenticatedApiSession>>,
) {
  try {
    const { items } = await getJobs(getAccessToken);
    return { ok: true as const, items };
  } catch {
    return { ok: false as const };
  }
}
import Link from "next/link";
