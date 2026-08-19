import Link from "next/link";

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
    <List className="space-y-3">
      {skills.map((skill, index) => (
        <li
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          key={skill.id}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div className="min-w-0">
              {ranked ? (
                <span className="mr-3 font-semibold text-slate-500">
                  {index + 1}.
                </span>
              ) : null}
              <span className="font-semibold text-slate-950">{skill.name}</span>
            </div>
            <span className="text-sm text-slate-600">
              {formatJobCount(skill.job_count)} ·{" "}
              {formatAnalyticsPercentage(skill.job_percentage)}
            </span>
          </div>
          <div
            aria-hidden="true"
            className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
          >
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${skill.job_percentage}%` }}
            />
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
        <h2 className="text-xl font-bold" id="top-skills-heading">
          Top skills
        </h2>
        <Link
          className="font-medium text-blue-700 hover:underline"
          href="/insights"
        >
          View all insights
        </Link>
      </div>
      {skills.length > 0 ? (
        <SkillDemandList skills={skills} />
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">
          Add descriptions or skills to see demand insights.
        </p>
      )}
    </section>
  );
}
