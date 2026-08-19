import Link from "next/link";

export function AuthShell({
  title,
  description,
  children,
  alternateHref,
  alternateLabel,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  alternateHref: string;
  alternateLabel: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-frame px-4 py-10 sm:px-6">
      <section className="w-full max-w-md rounded-xl border border-white/15 bg-surface p-6 shadow-sm sm:p-8">
        <p className="relative inline-block text-base font-bold tracking-tight text-ink">
          Apply<span className="text-brand">Gauge</span>
          <span
            aria-hidden="true"
            className="absolute -bottom-1 left-0 h-0.5 w-5 bg-brand"
          />
        </p>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-2 text-muted">{description}</p>
        <div className="mt-6">{children}</div>
        <Link
          className="focus-ring mt-6 inline-block rounded-sm text-sm font-semibold text-brand hover:text-brand-hover hover:underline"
          href={alternateHref}
        >
          {alternateLabel}
        </Link>
      </section>
    </main>
  );
}
