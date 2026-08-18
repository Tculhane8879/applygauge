import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api";

const mocks = vi.hoisted(() => ({
  getJob: vi.fn(),
  requireSession: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("@/lib/api/jobs", () => ({ getJob: mocks.getJob }));
vi.mock("@/lib/api/server", () => ({
  requireAuthenticatedApiSession: mocks.requireSession,
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: () => <button>Sign out</button>,
}));
vi.mock("@/components/jobs/job-form", () => ({
  JobForm: ({ job }: { job: { title: string } }) => (
    <form aria-label={job.title} />
  ),
}));

import EditJobPage from "./page";

describe("EditJobPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireSession.mockResolvedValue(vi.fn());
  });

  it("authenticates and preloads the owned job", async () => {
    mocks.getJob.mockResolvedValue({ id: "job-id", title: "Engineer" });
    render(await EditJobPage({ params: Promise.resolve({ jobId: "job-id" }) }));
    expect(mocks.requireSession).toHaveBeenCalledOnce();
    expect(screen.getByRole("form", { name: "Engineer" })).toBeInTheDocument();
  });

  it("maps a missing or non-owned job to not-found", async () => {
    mocks.getJob.mockRejectedValue(new ApiError(404));
    await expect(
      EditJobPage({ params: Promise.resolve({ jobId: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it("renders a safe error for other failures", async () => {
    mocks.getJob.mockRejectedValue(new ApiError(503));
    render(await EditJobPage({ params: Promise.resolve({ jobId: "job-id" }) }));
    expect(screen.getByRole("alert")).toHaveTextContent("could not be loaded");
  });
});
