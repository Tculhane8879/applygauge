import type { AuthenticatedIdentity } from "@/lib/api";

export function IdentityPanel({
  identity,
}: {
  identity: AuthenticatedIdentity;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="font-semibold">Verified backend identity</h2>
      <p className="mt-2 text-slate-700">{identity.email}</p>
      <p className="mt-1 break-all text-sm text-slate-500">
        User ID: {identity.id}
      </p>
    </section>
  );
}
