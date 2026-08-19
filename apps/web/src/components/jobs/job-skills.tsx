import { type SkillActionState } from "@/app/jobs/actions";
import { JobSkillForm } from "@/components/jobs/job-skill-form";
import { RemoveJobSkillButton } from "@/components/jobs/remove-job-skill-button";
import { type SkillRead } from "@/lib/api/jobs";
import { getSkillSourceLabel } from "@/lib/jobs/presentation";

export function JobSkills({
  addAction,
  removeAction,
  skills,
}: {
  addAction: (name: string) => Promise<SkillActionState>;
  removeAction: (skillId: string) => Promise<SkillActionState>;
  skills: SkillRead[] | null;
}) {
  return (
    <section
      className="mt-10 border-t border-line pt-8"
      aria-labelledby="skills-heading"
    >
      <h3 className="text-xl font-semibold text-ink" id="skills-heading">
        Skills
      </h3>
      <p className="mt-2 text-sm text-muted">
        Skills can be added manually or detected from the saved job description.
      </p>
      {skills === null ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          Skills are unavailable right now.
        </p>
      ) : (
        <>
          {skills.length === 0 ? (
            <p className="mt-3 text-muted">No skills added yet.</p>
          ) : (
            <ul className="mt-4 max-w-2xl divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
              {skills.map((skill) => (
                <li
                  className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2.5 text-ink"
                  key={skill.id}
                >
                  <div className="min-w-0">
                    <p className="break-words font-semibold">{skill.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {getSkillSourceLabel(skill.sources)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <RemoveJobSkillButton
                      action={removeAction.bind(null, skill.id)}
                      skillName={skill.name}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <JobSkillForm action={addAction} />
        </>
      )}
    </section>
  );
}
