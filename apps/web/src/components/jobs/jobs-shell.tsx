import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";

export function JobsShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <Link
            className="text-sm font-semibold text-blue-700"
            href="/dashboard"
          >
            ApplyGauge
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Saved Jobs</h1>
          <p className="mt-2 text-slate-600">
            Your private collection of job opportunities.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            className="font-medium text-blue-700 hover:underline"
            href="/dashboard"
          >
            Dashboard
          </Link>
          <SignOutButton />
        </div>
      </header>
      <div className="mt-8">{children}</div>
    </main>
  );
}
