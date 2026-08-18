import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticatedApiFetch: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  authenticatedApiFetch: mocks.authenticatedApiFetch,
}));

import { ApiError } from "@/lib/api";

import {
  createJob,
  deleteJob,
  getJob,
  getJobs,
  getStatusEvents,
  updateJob,
  updateJobStatus,
} from "./jobs";

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

  it("gets authenticated status history from the encoded job endpoint", async () => {
    const tokenProvider = vi.fn();
    const response = {
      items: [
        {
          id: "event-id",
          from_status: null,
          to_status: "SAVED",
          changed_at: "2026-08-17T12:00:00Z",
        },
      ],
    };
    mocks.authenticatedApiFetch.mockResolvedValue(response);

    await expect(getStatusEvents("job/id", tokenProvider)).resolves.toBe(
      response,
    );
    expect(mocks.authenticatedApiFetch).toHaveBeenCalledWith(
      "/api/v1/jobs/job%2Fid/status-events",
      tokenProvider,
    );
  });

  it("preserves typed API errors while reading status history", async () => {
    const error = new ApiError(404);
    mocks.authenticatedApiFetch.mockRejectedValueOnce(error);
    await expect(getStatusEvents("missing", vi.fn())).rejects.toBe(error);
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

  it("updates status through the authenticated dedicated endpoint", async () => {
    const tokenProvider = vi.fn();
    const response = { id: "job/id", current_status: "APPLIED" };
    mocks.authenticatedApiFetch.mockResolvedValueOnce(response);

    await expect(
      updateJobStatus("job/id", "APPLIED", tokenProvider),
    ).resolves.toBe(response);
    expect(mocks.authenticatedApiFetch).toHaveBeenCalledWith(
      "/api/v1/jobs/job%2Fid/status",
      tokenProvider,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPLIED" }),
      },
    );
  });

  it("preserves a status-update conflict", async () => {
    const error = new ApiError(409);
    mocks.authenticatedApiFetch.mockRejectedValueOnce(error);
    await expect(updateJobStatus("job-id", "APPLIED", vi.fn())).rejects.toBe(
      error,
    );
  });

  it("preserves an unexpected status-update failure", async () => {
    const error = new Error("connection failed");
    mocks.authenticatedApiFetch.mockRejectedValueOnce(error);
    await expect(updateJobStatus("job-id", "APPLIED", vi.fn())).rejects.toBe(
      error,
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
