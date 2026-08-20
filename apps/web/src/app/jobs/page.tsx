import { JobList } from "@/components/jobs/job-list";
import { JobsShell } from "@/components/jobs/jobs-shell";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { getJobs } from "@/lib/api/jobs";
import { requireAuthenticatedApiSession } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const getAccessToken = await requireAuthenticatedApiSession();
  const result = await loadJobs(getAccessToken);

  if (!result.ok) {
    return (
      <JobsShell>
        <Alert title="Saved jobs unavailable">
          Saved jobs could not be loaded right now. Please try again later.
        </Alert>
      </JobsShell>
    );
  }

  return (
    <JobsShell>
      <div className="mb-6 flex justify-end">
        <Link className={buttonStyles()} href="/jobs/new">
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
