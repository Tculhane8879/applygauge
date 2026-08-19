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
    <section className="mt-8" aria-labelledby="skills-heading">
      <h3 className="text-xl font-semibold" id="skills-heading">
        Skills
      </h3>
      <p className="mt-2 text-sm text-slate-600">
        Skills can be added manually or detected from the saved job description.
      </p>
      {skills === null ? (
        <p className="mt-3 text-slate-600" role="status">
          Skills are unavailable right now.
        </p>
      ) : (
        <>
          {skills.length === 0 ? (
            <p className="mt-3 text-slate-600">No skills added yet.</p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:flex sm:flex-wrap">
              {skills.map((skill) => (
                <li
                  className="flex min-w-0 items-center justify-between gap-4 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-800"
                  key={skill.id}
                >
                  <div className="min-w-0">
                    <p className="break-words font-medium">{skill.name}</p>
                    <p className="mt-0.5 text-sm text-slate-600">
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
