export function Alert({
  children,
  title = "Something went wrong",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <section
      className="rounded-lg border border-red-200 bg-red-50/70 px-4 py-3 text-ink"
      role="alert"
    >
      <h2 className="font-semibold text-danger">{title}</h2>
      <div className="mt-1 break-words text-sm text-ink/75">{children}</div>
    </section>
  );
}
