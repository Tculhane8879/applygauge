import Link from "next/link";

import { AnalyticsShell } from "@/components/analytics/analytics-shell";
import { MetricCards } from "@/components/analytics/metric-cards";
import { RecentJobs } from "@/components/analytics/recent-jobs";
import { TopSkillsSection } from "@/components/analytics/skill-demand-list";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
        activeSection="dashboard"
        description="Your job search at a glance."
        title="Dashboard"
      >
        <Alert title="Dashboard unavailable">
          Analytics could not be loaded right now. Please try again later.
        </Alert>
      </AnalyticsShell>
    );
  }

  if (overview.total_jobs === 0) {
    return (
      <AnalyticsShell
        activeSection="dashboard"
        description="Your job search at a glance."
        title="Dashboard"
      >
        <EmptyState
          action={
            <Link className={buttonStyles()} href="/jobs/new">
              Add job
            </Link>
          }
          description="Track a few jobs to start seeing skill demand and application insights."
          title="Start building your job-search picture"
        />
      </AnalyticsShell>
    );
  }

  return (
    <AnalyticsShell
      activeSection="dashboard"
      description="Your job search at a glance."
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
