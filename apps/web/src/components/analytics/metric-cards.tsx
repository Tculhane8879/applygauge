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
      <dl className="grid overflow-hidden rounded-xl border border-indigo-100 bg-analytics-tint sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            className="border-t border-indigo-200/70 p-5 first:border-t-0 sm:border-l sm:first:border-l-0 sm:[&:nth-child(2)]:border-t-0 sm:[&:nth-child(3)]:border-l-0 lg:border-t-0 lg:[&:nth-child(3)]:border-l"
            key={metric.label}
          >
            <dt className="text-sm font-semibold text-frame/75">
              {metric.label}
            </dt>
            <dd className="mt-2 text-3xl font-bold tracking-tight text-frame tabular-nums">
              {metric.value}
            </dd>
            <p className="mt-2 text-sm text-frame/65">{metric.support}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
