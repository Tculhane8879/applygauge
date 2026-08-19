import Link from "next/link";

import { AnalyticsShell } from "@/components/analytics/analytics-shell";
import { SkillDemandList } from "@/components/analytics/skill-demand-list";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getSkillInsights } from "@/lib/api/analytics";
import { requireAuthenticatedApiSession } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const getAccessToken = await requireAuthenticatedApiSession();
  let insights;
  try {
    insights = await getSkillInsights(getAccessToken);
  } catch {
    return (
      <AnalyticsShell
        activeSection="insights"
        description="See which skills appear most often across your tracked opportunities."
        title="Insights"
      >
        <Alert title="Insights unavailable">
          Insights could not be loaded right now. Please try again later.
        </Alert>
      </AnalyticsShell>
    );
  }

  if (insights.total_jobs === 0) {
    return (
      <AnalyticsShell
        activeSection="insights"
        description="See which skills appear most often across your tracked opportunities."
        title="Insights"
      >
        <EmptyState
          action={
            <Link className={buttonStyles()} href="/jobs/new">
              Add job
            </Link>
          }
          description="Add a job to begin building your skill-demand ranking."
          title="No jobs to analyze yet"
        />
      </AnalyticsShell>
    );
  }

  return (
    <AnalyticsShell
      activeSection="insights"
      description="See which skills appear most often across your tracked opportunities."
      title="Insights"
    >
      {insights.items.length > 0 ? (
        <SkillDemandList ranked skills={insights.items} />
      ) : (
        <EmptyState
          description="Add descriptions or skills to see demand insights."
          title="No skills to rank yet"
        />
      )}
    </AnalyticsShell>
  );
}
