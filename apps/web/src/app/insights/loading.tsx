export default function InsightsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading insights"
      className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6 sm:py-12"
    >
      <div className="h-24 rounded-xl bg-slate-200" />
      <p className="sr-only" role="status">
        Loading insights…
      </p>
      <div className="mt-8 space-y-3">
        {[1, 2, 3, 4, 5].map((item) => (
          <div className="h-24 rounded-xl bg-slate-200" key={item} />
        ))}
      </div>
    </main>
  );
}
