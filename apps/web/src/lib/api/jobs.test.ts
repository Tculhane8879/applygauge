import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticatedApiFetch: vi.fn() }));
vi.mock("@/lib/api", () => ({
  authenticatedApiFetch: mocks.authenticatedApiFetch,
}));

import { createJob, deleteJob, getJob, getJobs, updateJob } from "./jobs";

describe("jobs API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("gets the authenticated job list from the correct endpoint", async () => {
    const tokenProvider = vi.fn();
    mocks.authenticatedApiFetch.mockResolvedValue({ items: [] });

    await getJobs(tokenProvider);

    expect(mocks.authenticatedApiFetch).toHaveBeenCalledWith(
      "/api/v1/jobs",
      tokenProvider,
    );
  });

  it("gets one authenticated job and safely encodes its ID", async () => {
    const tokenProvider = vi.fn();
    mocks.authenticatedApiFetch.mockResolvedValue({ id: "job/id" });

    await getJob("job/id", tokenProvider);

    expect(mocks.authenticatedApiFetch).toHaveBeenCalledWith(
      "/api/v1/jobs/job%2Fid",
      tokenProvider,
    );
  });

  it("creates a job with the expected JSON request", async () => {
    const tokenProvider = vi.fn();
    const input = { company_name: "Acme", title: "Engineer" };
    await createJob(input, tokenProvider);
    expect(mocks.authenticatedApiFetch).toHaveBeenCalledWith(
      "/api/v1/jobs",
      tokenProvider,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    );
  });

  it("updates the encoded job endpoint with a PATCH payload", async () => {
    const tokenProvider = vi.fn();
    const input = { description: null };
    await updateJob("job/id", input, tokenProvider);
    expect(mocks.authenticatedApiFetch).toHaveBeenCalledWith(
      "/api/v1/jobs/job%2Fid",
      tokenProvider,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    );
  });

  it("deletes the encoded job endpoint", async () => {
    const tokenProvider = vi.fn();
    await deleteJob("job/id", tokenProvider);
    expect(mocks.authenticatedApiFetch).toHaveBeenCalledWith(
      "/api/v1/jobs/job%2Fid",
      tokenProvider,
      { method: "DELETE" },
    );
  });
});
