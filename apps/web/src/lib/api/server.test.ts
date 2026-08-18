import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
  getSession: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: mocks.getClaims, getSession: mocks.getSession },
  }),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { requireAuthenticatedApiSession } from "./server";

describe("requireAuthenticatedApiSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects an unauthenticated server render", async () => {
    mocks.getClaims.mockResolvedValue({ data: null });

    await expect(requireAuthenticatedApiSession()).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("provides the current access token without exposing it to a component", async () => {
    mocks.getClaims.mockResolvedValue({
      data: {
        claims: {
          sub: "user-id",
          email: "person@example.test",
          role: "authenticated",
          is_anonymous: false,
        },
      },
    });
    mocks.getSession.mockResolvedValue({
      data: { session: { access_token: "server-access-token" } },
    });

    const getAccessToken = await requireAuthenticatedApiSession();

    await expect(getAccessToken()).resolves.toBe("server-access-token");
  });
});
