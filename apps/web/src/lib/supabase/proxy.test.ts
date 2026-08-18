import { describe, expect, it } from "vitest";

import { authRedirect } from "./proxy";

describe("authRedirect", () => {
  it("redirects unauthenticated dashboard requests to login", () => {
    expect(authRedirect("/dashboard", false)).toBe("/login");
    expect(authRedirect("/jobs", false)).toBe("/login");
    expect(authRedirect("/jobs/job-id", false)).toBe("/login");
  });

  it("redirects authenticated users away from anonymous-only routes", () => {
    expect(authRedirect("/login", true)).toBe("/dashboard");
    expect(authRedirect("/signup", true)).toBe("/dashboard");
  });

  it("allows routes appropriate to the current state", () => {
    expect(authRedirect("/dashboard", true)).toBeNull();
    expect(authRedirect("/jobs", true)).toBeNull();
    expect(authRedirect("/login", false)).toBeNull();
  });
});
