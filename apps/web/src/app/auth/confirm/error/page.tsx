import Link from "next/link";

export default function ConfirmationErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-bold">Confirmation link unavailable</h1>
        <p className="mt-3 text-slate-600">
          The link is invalid or expired. Return to signup to request a new
          confirmation email.
        </p>
        <Link
          className="mt-5 inline-block font-medium text-blue-700"
          href="/signup"
        >
          Return to signup
        </Link>
      </section>
    </main>
  );
}
