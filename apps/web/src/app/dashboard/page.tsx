import Link from "next/link";

import { AnalyticsShell } from "@/components/analytics/analytics-shell";
import { MetricCards } from "@/components/analytics/metric-cards";
import { RecentJobs } from "@/components/analytics/recent-jobs";
import { TopSkillsSection } from "@/components/analytics/skill-demand-list";
import { getAnalyticsOverview } from "@/lib/api/analytics";
import { requireAuthenticatedApiSession } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const getAccessToken = await requireAuthenticatedApiSession();
  let overview;
  try {
    overview = await getAnalyticsOverview(getAccessToken);
  } catch {
    return (
      <AnalyticsShell
        description="Your current job-search activity and skill demand."
        title="Dashboard"
      >
        <p className="rounded-xl bg-red-50 p-4 text-red-800" role="alert">
          Analytics could not be loaded right now. Please try again later.
        </p>
      </AnalyticsShell>
    );
  }

  if (overview.total_jobs === 0) {
    return (
      <AnalyticsShell
        description="Your current job-search activity and skill demand."
        title="Dashboard"
      >
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center">
          <h2 className="text-2xl font-bold text-blue-950">
            Start building your job-search picture
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-blue-900">
            Track a few jobs to start seeing skill demand and application
            insights.
          </p>
          <Link
            className="mt-6 inline-flex rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white"
            href="/jobs/new"
          >
            Add job
          </Link>
        </section>
      </AnalyticsShell>
    );
  }

  return (
    <AnalyticsShell
      description="Your current job-search activity and skill demand."
      title="Dashboard"
    >
      <MetricCards overview={overview} />
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <TopSkillsSection skills={overview.top_skills} />
        <RecentJobs jobs={overview.recent_jobs} />
      </div>
    </AnalyticsShell>
  );
}
