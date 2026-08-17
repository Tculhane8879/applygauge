import { describe, expect, it } from "vitest";

import { hasAuthenticatedClaims } from "./claims";

describe("hasAuthenticatedClaims", () => {
  it("accepts the verified identity policy", () => {
    expect(
      hasAuthenticatedClaims({
        sub: "user",
        email: "person@example.test",
        role: "authenticated",
        is_anonymous: false,
      }),
    ).toBe(true);
  });

  it("rejects anonymous or non-authenticated claims", () => {
    expect(
      hasAuthenticatedClaims({
        sub: "user",
        email: "person@example.test",
        role: "anon",
        is_anonymous: false,
      }),
    ).toBe(false);
    expect(
      hasAuthenticatedClaims({
        sub: "user",
        email: "person@example.test",
        role: "authenticated",
        is_anonymous: true,
      }),
    ).toBe(false);
  });
});
