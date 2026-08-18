import Link from "next/link";

import { DeleteJobButton } from "@/components/jobs/delete-job-button";
import { type JobRead } from "@/lib/api/jobs";
import { type JobActionState } from "@/lib/jobs/form";
import {
  employmentTypeLabel,
  formatJobDateTime,
  workArrangementLabel,
} from "@/lib/jobs/presentation";

export function JobDetail({
  deleteAction,
  job,
}: {
  deleteAction: () => Promise<JobActionState>;
  job: JobRead;
}) {
  return (
    <article>
      <p className="font-semibold text-blue-700">{job.company.name}</p>
      <h2 className="mt-2 text-3xl font-bold text-slate-950">{job.title}</h2>
      <div className="mt-5 flex items-start gap-5">
        <Link
          className="font-semibold text-blue-700 hover:underline"
          href={`/jobs/${job.id}/edit`}
        >
          Edit
        </Link>
        <DeleteJobButton action={deleteAction} />
      </div>

      <dl className="mt-8 grid gap-5 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
        {job.location ? (
          <DetailItem label="Location" value={job.location} />
        ) : null}
        <DetailItem
          label="Work arrangement"
          value={workArrangementLabel(job.work_arrangement)}
        />
        <DetailItem
          label="Employment type"
          value={employmentTypeLabel(job.employment_type)}
        />
        <DetailItem label="Saved" value={formatJobDateTime(job.created_at)} />
        <DetailItem
          label="Last updated"
          value={formatJobDateTime(job.updated_at)}
        />
        {job.job_url ? (
          <div>
            <dt className="text-sm font-medium text-slate-500">
              Original posting
            </dt>
            <dd className="mt-1">
              <a
                className="font-medium text-blue-700 hover:underline"
                href={job.job_url}
                rel="noopener noreferrer"
                target="_blank"
              >
                View job posting (opens in a new tab)
              </a>
            </dd>
          </div>
        ) : null}
      </dl>

      <section className="mt-8" aria-labelledby="description-heading">
        <h3 className="text-xl font-semibold" id="description-heading">
          Description
        </h3>
        {job.description ? (
          <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">
            {job.description}
          </p>
        ) : (
          <p className="mt-3 text-slate-600">
            No description was saved for this job.
          </p>
        )}
      </section>
    </article>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-800">{value}</dd>
    </div>
  );
}
