import Link from "next/link";

import { JobsShell } from "@/components/jobs/jobs-shell";

export default function JobNotFound() {
  return (
    <JobsShell>
      <section className="rounded-xl border border-slate-200 bg-white p-8">
        <h2 className="text-2xl font-semibold">Job not found</h2>
        <p className="mt-2 text-slate-600">
          This saved job is unavailable or does not exist.
        </p>
        <Link
          className="mt-5 inline-block font-medium text-blue-700 hover:underline"
          href="/jobs"
        >
          Return to saved jobs
        </Link>
      </section>
    </JobsShell>
  );
}
