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
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-blue-700">ApplyGauge</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-slate-600">{description}</p>
        <div className="mt-6">{children}</div>
        <Link
          className="mt-6 block text-sm font-medium text-blue-700 hover:underline"
          href={alternateHref}
        >
          {alternateLabel}
        </Link>
      </section>
    </main>
  );
}
