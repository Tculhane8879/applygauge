import { redirect } from "next/navigation";

import { type AccessTokenProvider } from "@/lib/api";
import { hasAuthenticatedClaims } from "@/lib/auth/claims";
import { createClient } from "@/lib/supabase/server";

export async function requireAuthenticatedApiSession(): Promise<AccessTokenProvider> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!hasAuthenticatedClaims(claimsData?.claims)) redirect("/login");

  return async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };
}
