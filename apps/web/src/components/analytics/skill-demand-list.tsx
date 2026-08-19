import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import {
  formatAnalyticsPercentage,
  formatJobCount,
} from "@/lib/analytics/presentation";
import { type SkillDemandRead } from "@/lib/api/analytics";

export function SkillDemandList({
  skills,
  ranked = false,
}: {
  skills: SkillDemandRead[];
  ranked?: boolean;
}) {
  const List = ranked ? "ol" : "ul";

  return (
    <List className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {skills.map((skill, index) => (
        <li className="p-4 sm:p-5" key={skill.id}>
          <div className="flex items-start gap-4">
            {ranked ? (
              <span className="w-7 shrink-0 pt-0.5 text-sm font-bold text-brand/65 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="break-words font-semibold text-ink">
                  {skill.name}
                </span>
                <span className="text-sm text-muted">
                  {formatJobCount(skill.job_count)} ·{" "}
                  {formatAnalyticsPercentage(skill.job_percentage)}
                </span>
              </div>
              <div
                aria-hidden="true"
                className="mt-3 h-1 overflow-hidden rounded-full bg-indigo-100"
              >
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${skill.job_percentage}%` }}
                />
              </div>
            </div>
          </div>
        </li>
      ))}
    </List>
  );
}

export function TopSkillsSection({ skills }: { skills: SkillDemandRead[] }) {
  return (
    <section aria-labelledby="top-skills-heading">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold text-ink" id="top-skills-heading">
          Top skills
        </h2>
        <Link
          className="focus-ring rounded-sm font-semibold text-brand hover:text-brand-hover hover:underline"
          href="/insights"
        >
          View all insights
        </Link>
      </div>
      {skills.length > 0 ? (
        <SkillDemandList skills={skills} />
      ) : (
        <EmptyState
          description="Add descriptions or skills to see demand insights."
          title="No skills to summarize yet"
        />
      )}
    </section>
  );
}
