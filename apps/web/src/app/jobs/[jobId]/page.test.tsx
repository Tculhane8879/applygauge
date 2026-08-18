import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api";
import { type JobRead } from "@/lib/api/jobs";

const mocks = vi.hoisted(() => ({
  getJob: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  requireAuthenticatedApiSession: vi.fn(),
}));
vi.mock("@/lib/api/jobs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/jobs")>()),
  getJob: mocks.getJob,
}));
vi.mock("@/lib/api/server", () => ({
  requireAuthenticatedApiSession: mocks.requireAuthenticatedApiSession,
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: () => <button>Sign out</button>,
}));

import JobDetailPage from "./page";

const job: JobRead = {
  id: "job-id",
  company: { id: "company-id", name: "Acme" },
  title: "Software Engineer",
  job_url: null,
  location: null,
  work_arrangement: "REMOTE",
  employment_type: "FULL_TIME",
  description: null,
  created_at: "2026-08-17T12:00:00Z",
  updated_at: "2026-08-17T12:00:00Z",
};

describe("JobDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedApiSession.mockResolvedValue(vi.fn());
  });

  it("renders an authenticated job detail", async () => {
    mocks.getJob.mockResolvedValue(job);

    render(await JobDetailPage({ params: Promise.resolve({ jobId: job.id }) }));

    expect(
      screen.getByRole("heading", { name: job.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Back to saved jobs/ }),
    ).toHaveAttribute("href", "/jobs");
  });

  it("maps an API 404 to the privacy-preserving not-found path", async () => {
    mocks.getJob.mockRejectedValue(new ApiError(404));

    await expect(
      JobDetailPage({ params: Promise.resolve({ jobId: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it("renders a safe state for an unexpected backend failure", async () => {
    mocks.getJob.mockRejectedValue(new ApiError(503));

    render(
      await JobDetailPage({
        params: Promise.resolve({ jobId: "unavailable" }),
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This job could not be loaded",
    );
  });
});
