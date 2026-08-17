import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { hasAuthenticatedClaims } from "@/lib/auth/claims";

import { getSupabaseConfig } from "./config";

const protectedPaths = ["/dashboard"];
const anonymousOnlyPaths = ["/login", "/signup"];

export function authRedirect(pathname: string, authenticated: boolean) {
  if (
    !authenticated &&
    protectedPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return "/login";
  }
  if (authenticated && anonymousOnlyPaths.includes(pathname)) {
    return "/dashboard";
  }
  return null;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const destination = authRedirect(
    request.nextUrl.pathname,
    hasAuthenticatedClaims(data?.claims),
  );
  if (destination) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = destination;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }
  return response;
}
