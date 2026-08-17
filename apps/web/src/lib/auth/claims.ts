export function hasAuthenticatedClaims(claims: unknown): claims is Record<
  string,
  unknown
> & {
  sub: string;
  email: string;
  role: "authenticated";
  is_anonymous: false;
} {
  if (!claims || typeof claims !== "object") return false;
  const value = claims as Record<string, unknown>;
  return (
    typeof value.sub === "string" &&
    typeof value.email === "string" &&
    value.role === "authenticated" &&
    value.is_anonymous === false
  );
}
