import { describe, expect, it, vi } from "vitest";

import { ApiError, authenticatedApiFetch, baseApiFetch } from "./api";

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

describe("baseApiFetch", () => {
  it("accepts an empty 204 response", async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: vi.fn(),
    });
    await expect(
      baseApiFetch("/api/v1/jobs/1", undefined, fetchImplementation),
    ).resolves.toBeUndefined();
  });

  it("exposes response status without exposing a raw response body", async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "private backend details",
    });

    await expect(
      baseApiFetch("/api/v1/jobs/missing", undefined, fetchImplementation),
    ).rejects.toEqual(new ApiError(404));
    expect(fetchImplementation.mock.results[0]?.value).toBeDefined();
  });

  it("represents an unauthorized response without exposing its body", async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "expired token details",
    });

    await expect(
      baseApiFetch("/api/v1/jobs", undefined, fetchImplementation),
    ).rejects.toEqual(new ApiError(401));
    expect(fetchImplementation.mock.results[0]?.value).toBeDefined();
  });
});
