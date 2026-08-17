import { redirect } from "next/navigation";

import { IdentityPanel } from "@/components/auth/identity-panel";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getAuthenticatedIdentity } from "@/lib/api";
import { hasAuthenticatedClaims } from "@/lib/auth/claims";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!hasAuthenticatedClaims(claimsData?.claims)) redirect("/login");
  const email = claimsData.claims.email;

  let identity;
  try {
    identity = await getAuthenticatedIdentity(async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    });
  } catch {
    return (
      <DashboardShell email={email}>
        <p className="rounded-xl bg-red-50 p-4 text-red-800" role="alert">
          FastAPI could not verify this session. Please sign out and try again.
        </p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell email={email}>
      <IdentityPanel identity={identity} />
    </DashboardShell>
  );
}

function DashboardShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-blue-700">ApplyGauge</p>
          <h1 className="mt-2 text-3xl font-bold">Authentication verified</h1>
          <p className="mt-2 text-slate-600">Signed in as {email}</p>
        </div>
        <SignOutButton />
      </header>
      <div className="mt-8">{children}</div>
    </main>
  );
}
