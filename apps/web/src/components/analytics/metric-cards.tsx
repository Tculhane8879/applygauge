import { formatAnalyticsPercentage } from "@/lib/analytics/presentation";
import { type AnalyticsOverviewRead } from "@/lib/api/analytics";

export function MetricCards({ overview }: { overview: AnalyticsOverviewRead }) {
  const metrics = [
    {
      label: "Total opportunities",
      value: String(overview.total_jobs),
      support: "All tracked jobs",
    },
    {
      label: "Applied or later",
      value: String(overview.applied_jobs),
      support: "Current application stages",
    },
    {
      label: "In interview",
      value: String(overview.interview_jobs),
      support: "Currently interviewing",
    },
    {
      label: "Response rate",
      value:
        overview.response_rate_percentage === null
          ? "No applications yet"
          : formatAnalyticsPercentage(overview.response_rate_percentage),
      support: "Based on current application stages",
    },
  ];

  return (
    <section aria-labelledby="summary-heading">
      <h2 className="sr-only" id="summary-heading">
        Job search summary
      </h2>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            key={metric.label}
          >
            <dt className="text-sm font-semibold text-slate-600">
              {metric.label}
            </dt>
            <dd className="mt-2 text-2xl font-bold text-slate-950">
              {metric.value}
            </dd>
            <p className="mt-2 text-sm text-slate-500">{metric.support}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
