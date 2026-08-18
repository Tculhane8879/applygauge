import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api";
import { type JobRead } from "@/lib/api/jobs";

const mocks = vi.hoisted(() => ({
  getJob: vi.fn(),
  getStatusEvents: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  refresh: vi.fn(),
  requireAuthenticatedApiSession: vi.fn(),
}));
vi.mock("@/lib/api/jobs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/jobs")>()),
  getJob: mocks.getJob,
  getStatusEvents: mocks.getStatusEvents,
}));
vi.mock("@/lib/api/server", () => ({
  requireAuthenticatedApiSession: mocks.requireAuthenticatedApiSession,
}));
vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  useRouter: () => ({ refresh: mocks.refresh }),
}));
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
  current_status: "SAVED",
  description: null,
  created_at: "2026-08-17T12:00:00Z",
  updated_at: "2026-08-17T12:00:00Z",
};

describe("JobDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedApiSession.mockResolvedValue(vi.fn());
    mocks.getStatusEvents.mockResolvedValue({
      items: [
        {
          id: "event-id",
          from_status: null,
          to_status: "SAVED",
          changed_at: "2026-08-17T12:00:00Z",
        },
      ],
    });
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
    expect(mocks.getStatusEvents).toHaveBeenCalledWith(
      job.id,
      expect.any(Function),
    );
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

  it("maps a history 404 to the same privacy-preserving not-found path", async () => {
    mocks.getJob.mockResolvedValue(job);
    mocks.getStatusEvents.mockRejectedValue(new ApiError(404));

    await expect(
      JobDetailPage({ params: Promise.resolve({ jobId: job.id }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it("keeps job detail available when history has an unexpected failure", async () => {
    mocks.getJob.mockResolvedValue(job);
    mocks.getStatusEvents.mockRejectedValue(new ApiError(503));

    render(await JobDetailPage({ params: Promise.resolve({ jobId: job.id }) }));

    expect(
      screen.getByRole("heading", { name: job.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Status history is unavailable."),
    ).toBeInTheDocument();
  });
});
