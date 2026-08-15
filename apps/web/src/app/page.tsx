import { ApiStatus } from "@/components/api-status";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Engineering foundation
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">ApplyGauge</h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
          Turn your job search into actionable data.
        </p>
        <ApiStatus />
      </section>
    </main>
  );
}
