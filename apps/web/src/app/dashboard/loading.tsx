export default function DashboardLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading dashboard"
      className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6 sm:py-12"
    >
      <div className="h-24 rounded-xl bg-slate-200" />
      <p className="sr-only" role="status">
        Loading dashboard…
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div className="h-32 rounded-xl bg-slate-200" key={item} />
        ))}
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="h-80 rounded-xl bg-slate-200" />
        <div className="h-80 rounded-xl bg-slate-200" />
      </div>
    </main>
  );
}
