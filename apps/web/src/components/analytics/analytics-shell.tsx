import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";

export function AnalyticsShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <Link
            className="text-sm font-semibold text-blue-700"
            href="/dashboard"
          >
            ApplyGauge
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{title}</h1>
          <p className="mt-2 max-w-2xl text-slate-600">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <nav aria-label="Primary" className="flex items-center gap-4">
            <Link
              className="font-medium text-blue-700 hover:underline"
              href="/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="font-medium text-blue-700 hover:underline"
              href="/jobs"
            >
              Jobs
            </Link>
            <Link
              className="font-medium text-blue-700 hover:underline"
              href="/insights"
            >
              Insights
            </Link>
          </nav>
          <SignOutButton />
        </div>
      </header>
      <div className="mt-8">{children}</div>
    </main>
  );
}
