export function EmptyState({
  action,
  description,
  title,
}: {
  action?: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="rounded-xl border border-indigo-100 bg-analytics-tint/55 px-5 py-8 text-center sm:px-8">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
