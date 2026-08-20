export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-frame pt-16">
      <div className="mx-auto max-w-6xl px-2 pb-2 sm:px-4 sm:pb-4">
        <main
          aria-busy="true"
          aria-label="Loading dashboard"
          className="min-h-[calc(100vh-5.5rem)] rounded-xl bg-surface px-4 py-8 sm:px-6 sm:py-10 lg:px-12"
        >
          <div className="mx-auto max-w-5xl motion-safe:animate-pulse motion-reduce:animate-none">
            <div className="border-b border-line pb-6">
              <div className="h-8 w-40 rounded-lg bg-surface-muted" />
              <div className="mt-3 h-4 w-64 max-w-full rounded bg-surface-muted" />
            </div>
            <p className="sr-only" role="status">
              Loading dashboardâ€¦
            </p>
            <div className="mt-8 grid overflow-hidden rounded-xl border border-indigo-100 bg-analytics-tint sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div className="h-32 border-indigo-100 p-5" key={item}>
                  <div className="h-4 w-24 rounded bg-indigo-100" />
                  <div className="mt-4 h-8 w-16 rounded bg-indigo-200/70" />
                  <div className="mt-3 h-3 w-28 rounded bg-indigo-100" />
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              {[1, 2].map((section) => (
                <div key={section}>
                  <div className="h-6 w-36 rounded bg-surface-muted" />
                  <div className="mt-4 h-72 rounded-xl border border-line bg-surface-muted/70" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
