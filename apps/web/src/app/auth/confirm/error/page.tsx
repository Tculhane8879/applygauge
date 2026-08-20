import Link from "next/link";

export default function ConfirmationErrorPage() {
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
        <h1 className="mt-6 text-2xl font-bold text-ink">
          Confirmation link unavailable
        </h1>
        <p className="mt-3 text-muted">
          The link is invalid or expired. Return to signup to request a new
          confirmation email.
        </p>
        <Link
          className="focus-ring mt-5 inline-block rounded-sm font-semibold text-brand hover:text-brand-hover hover:underline"
          href="/signup"
        >
          Return to signup
        </Link>
      </section>
    </main>
  );
}
