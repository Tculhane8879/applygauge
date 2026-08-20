import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";

export type AppSection = "dashboard" | "jobs" | "insights";

const destinations: ReadonlyArray<{
  href: string;
  label: string;
  section: AppSection;
}> = [
  { href: "/dashboard", label: "Dashboard", section: "dashboard" },
  { href: "/jobs", label: "Jobs", section: "jobs" },
  { href: "/insights", label: "Insights", section: "insights" },
];

export function AppShell({
  activeSection,
  children,
  description,
  title,
}: {
  activeSection: AppSection;
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="min-h-screen bg-frame">
      <header>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-4 sm:px-6">
          <Link
            className="focus-ring relative rounded-sm text-base font-bold tracking-tight text-white focus-visible:ring-indigo-300 focus-visible:ring-offset-frame"
            href="/dashboard"
          >
            Apply<span className="text-indigo-300">Gauge</span>
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-0 h-0.5 w-5 bg-indigo-300"
            />
          </Link>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2 sm:gap-x-3">
            <nav aria-label="Primary">
              <div className="flex flex-wrap items-center gap-1">
                {destinations.map((destination) => {
                  const active = destination.section === activeSection;
                  return (
                    <div key={destination.section}>
                      <Link
                        aria-current={active ? "page" : undefined}
                        className={`focus-ring relative inline-flex min-h-10 items-center rounded-md px-3 text-sm font-semibold transition-colors focus-visible:ring-indigo-300 focus-visible:ring-offset-frame ${
                          active
                            ? "text-white"
                            : "text-frame-muted hover:bg-white/10 hover:text-white"
                        }`}
                        href={destination.href}
                      >
                        {destination.label}
                        {active ? (
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-3 -bottom-1 h-0.5 bg-indigo-300"
                          />
                        ) : null}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </nav>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-2 pb-2 sm:px-4 sm:pb-4">
        <main className="min-h-[calc(100vh-5.5rem)] rounded-xl bg-surface px-4 py-8 sm:px-6 sm:py-10 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <header className="border-b border-line pb-6">
              <h1 className="text-3xl font-bold tracking-tight text-ink">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-muted">{description}</p>
            </header>
            <div className="mt-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
