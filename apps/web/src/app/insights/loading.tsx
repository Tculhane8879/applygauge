export default function InsightsLoading() {
  return (
    <div className="min-h-screen bg-frame pt-16">
      <div className="mx-auto max-w-6xl px-2 pb-2 sm:px-4 sm:pb-4">
        <main
          aria-busy="true"
          aria-label="Loading insights"
          className="min-h-[calc(100vh-5.5rem)] rounded-xl bg-surface px-4 py-8 sm:px-6 sm:py-10 lg:px-12"
        >
          <div className="mx-auto max-w-5xl motion-safe:animate-pulse motion-reduce:animate-none">
            <div className="border-b border-line pb-6">
              <div className="h-8 w-32 rounded-lg bg-surface-muted" />
              <div className="mt-3 h-4 w-96 max-w-full rounded bg-surface-muted" />
            </div>
            <p className="sr-only" role="status">
              Loading insightsâ€¦
            </p>
            <div className="mt-8 divide-y divide-line overflow-hidden rounded-xl border border-line">
              {[1, 2, 3, 4, 5].map((item) => (
                <div className="flex h-24 items-center gap-4 p-5" key={item}>
                  <div className="h-4 w-7 rounded bg-indigo-100" />
                  <div className="flex-1">
                    <div className="h-4 w-40 max-w-full rounded bg-surface-muted" />
                    <div className="mt-4 h-1 w-full rounded bg-indigo-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
