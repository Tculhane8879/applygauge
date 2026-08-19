import { type SkillActionState } from "@/app/jobs/actions";
import { JobSkillForm } from "@/components/jobs/job-skill-form";
import { RemoveJobSkillButton } from "@/components/jobs/remove-job-skill-button";
import { type SkillRead } from "@/lib/api/jobs";

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
      {skills === null ? (
        <p className="mt-3 text-slate-600" role="status">
          Skills are unavailable right now.
        </p>
      ) : (
        <>
          {skills.length === 0 ? (
            <p className="mt-3 text-slate-600">No skills added yet.</p>
          ) : (
            <ul className="mt-4 flex flex-wrap gap-3">
              {skills.map((skill) => (
                <li
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-800"
                  key={skill.id}
                >
                  <span className="font-medium">{skill.name}</span>
                  <div className="mt-1">
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
