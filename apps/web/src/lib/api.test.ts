import { describe, expect, it, vi } from "vitest";

import { authenticatedApiFetch } from "./api";

describe("authenticatedApiFetch", () => {
  it("adds a bearer token and preserves caller headers", async () => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ id: "1" }) });
    await authenticatedApiFetch(
      "/api/v1/auth/me",
      async () => "access-token",
      { headers: { "X-Request-ID": "request-1" } },
      fetchImplementation,
    );
    const headers = fetchImplementation.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer access-token");
    expect(headers.get("X-Request-ID")).toBe("request-1");
  });

  it("fails before calling the API when no token exists", async () => {
    const fetchImplementation = vi.fn();
    await expect(
      authenticatedApiFetch(
        "/api/v1/auth/me",
        async () => null,
        undefined,
        fetchImplementation,
      ),
    ).rejects.toThrow("authenticated session");
    expect(fetchImplementation).not.toHaveBeenCalled();
  });
});
