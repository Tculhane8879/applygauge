import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center bg-frame px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-3xl rounded-xl bg-surface px-6 py-12 sm:px-10 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">
          Job-search intelligence
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          ApplyGauge
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
          Track opportunities, follow application progress, and understand the
          technologies employers request across your saved jobs.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className={buttonStyles()} href="/login">
            Sign in
          </Link>
          <Link
            className={buttonStyles({ variant: "secondary" })}
            href="/signup"
          >
            Create account
          </Link>
        </div>
      </section>
    </main>
  );
}
