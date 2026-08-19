import Link from "next/link";

import { AnalyticsShell } from "@/components/analytics/analytics-shell";
import { SkillDemandList } from "@/components/analytics/skill-demand-list";
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
        description="See which skills appear most often across your tracked opportunities."
        title="Insights"
      >
        <p className="rounded-xl bg-red-50 p-4 text-red-800" role="alert">
          Insights could not be loaded right now. Please try again later.
        </p>
      </AnalyticsShell>
    );
  }

  if (insights.total_jobs === 0) {
    return (
      <AnalyticsShell
        description="See which skills appear most often across your tracked opportunities."
        title="Insights"
      >
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center">
          <h2 className="text-2xl font-bold text-blue-950">
            No jobs to analyze yet
          </h2>
          <p className="mt-3 text-blue-900">
            Add a job to begin building your skill-demand ranking.
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
      description="See which skills appear most often across your tracked opportunities."
      title="Insights"
    >
      {insights.items.length > 0 ? (
        <SkillDemandList ranked skills={insights.items} />
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Add descriptions or skills to see demand insights.
        </p>
      )}
    </AnalyticsShell>
  );
}
