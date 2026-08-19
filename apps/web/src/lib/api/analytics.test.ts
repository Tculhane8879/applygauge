import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticatedApiFetch: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  authenticatedApiFetch: mocks.authenticatedApiFetch,
}));

import { ApiError } from "@/lib/api";

import { getAnalyticsOverview, getSkillInsights } from "./analytics";

describe("analytics API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("gets the authenticated overview from the exact endpoint", async () => {
    const tokenProvider = vi.fn();
    const response = { total_jobs: 0, top_skills: [], recent_jobs: [] };
    mocks.authenticatedApiFetch.mockResolvedValue(response);

    await expect(getAnalyticsOverview(tokenProvider)).resolves.toBe(response);
    expect(mocks.authenticatedApiFetch).toHaveBeenCalledWith(
      "/api/v1/analytics/overview",
      tokenProvider,
    );
  });

  it("gets the complete skill ranking without a query string", async () => {
    const tokenProvider = vi.fn();
    const response = { total_jobs: 2, items: [{ name: "C++" }] };
    mocks.authenticatedApiFetch.mockResolvedValue(response);

    await expect(getSkillInsights(tokenProvider)).resolves.toBe(response);
    expect(mocks.authenticatedApiFetch).toHaveBeenCalledWith(
      "/api/v1/analytics/skills",
      tokenProvider,
    );
    expect(mocks.authenticatedApiFetch.mock.calls[0]?.[0]).not.toContain("?");
  });

  it.each([getAnalyticsOverview, getSkillInsights])(
    "preserves ApiError from authenticated transport",
    async (operation) => {
      const error = new ApiError(503);
      mocks.authenticatedApiFetch.mockRejectedValue(error);
      await expect(operation(vi.fn())).rejects.toBe(error);
    },
  );
});
