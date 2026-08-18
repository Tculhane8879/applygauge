import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getJobs: vi.fn(),
  requireAuthenticatedApiSession: vi.fn(),
}));
vi.mock("@/lib/api/jobs", () => ({ getJobs: mocks.getJobs }));
vi.mock("@/lib/api/server", () => ({
  requireAuthenticatedApiSession: mocks.requireAuthenticatedApiSession,
}));
vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: () => <button>Sign out</button>,
}));

import JobsPage from "./page";

describe("JobsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedApiSession.mockResolvedValue(vi.fn());
  });

  it("renders the empty state returned by the authenticated API", async () => {
    mocks.getJobs.mockResolvedValue({ items: [] });

    render(await JobsPage());

    expect(
      screen.getByRole("heading", { name: "No saved jobs yet" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add job" })).toHaveAttribute(
      "href",
      "/jobs/new",
    );
    expect(mocks.requireAuthenticatedApiSession).toHaveBeenCalledOnce();
  });

  it("renders a safe page error when FastAPI is unavailable", async () => {
    mocks.getJobs.mockRejectedValue(new Error("connection refused"));

    render(await JobsPage());

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Saved jobs could not be loaded",
    );
    expect(screen.queryByText("connection refused")).not.toBeInTheDocument();
  });
});
