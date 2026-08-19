import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAnalyticsOverview: vi.fn(),
  requireAuthenticatedApiSession: vi.fn(),
}));
vi.mock("@/lib/api/analytics", () => ({
  getAnalyticsOverview: mocks.getAnalyticsOverview,
}));
vi.mock("@/lib/api/server", () => ({
  requireAuthenticatedApiSession: mocks.requireAuthenticatedApiSession,
}));
vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: () => <button>Sign out</button>,
}));

import DashboardLoading from "./loading";
import DashboardPage from "./page";

const overview = {
  total_jobs: 6,
  applied_jobs: 5,
  interview_jobs: 1,
  response_rate_percentage: 80,
  top_skills: [
    {
      id: "python",
      name: "Python",
      category: "LANGUAGE" as const,
      job_count: 3,
      job_percentage: 50,
    },
    {
      id: "cpp",
      name: "C++",
      category: "LANGUAGE" as const,
      job_count: 1,
      job_percentage: 16.7,
    },
  ],
  recent_jobs: [
    {
      id: "newest",
      title: "Platform Engineer",
      company_name: "New Company",
      current_status: "INTERVIEW" as const,
      created_at: "2026-08-19T00:00:00Z",
    },
    {
      id: "older",
      title: "Backend Engineer",
      company_name: "Older Company",
      current_status: "APPLIED" as const,
      created_at: "2026-08-18T00:00:00Z",
    },
  ],
};

describe("DashboardPage", () => {
  const tokenProvider = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedApiSession.mockResolvedValue(tokenProvider);
    mocks.getAnalyticsOverview.mockResolvedValue(overview);
  });

  it("fetches through the authenticated Server Component and renders backend metrics", async () => {
    render(await DashboardPage());

    expect(mocks.requireAuthenticatedApiSession).toHaveBeenCalledOnce();
    expect(mocks.getAnalyticsOverview).toHaveBeenCalledWith(tokenProvider);
    expect(
      screen.getByText("Total opportunities").nextElementSibling,
    ).toHaveTextContent("6");
    expect(
      screen.getByText("Applied or later").nextElementSibling,
    ).toHaveTextContent("5");
    expect(
      screen.getByText("In interview").nextElementSibling,
    ).toHaveTextContent("1");
    expect(
      screen.getByText("Response rate").nextElementSibling,
    ).toHaveTextContent("80.0%");
    expect(
      screen.getByText("Based on current application stages"),
    ).toBeInTheDocument();
  });

  it("preserves supplied skill and recent-job ordering with exact values and links", async () => {
    render(await DashboardPage());

    const skills = within(
      screen.getByRole("heading", { name: "Top skills" }).closest("section")!,
    );
    const skillRows = skills.getAllByRole("listitem");
    expect(skillRows[0]).toHaveTextContent("Python");
    expect(skillRows[0]).toHaveTextContent("3 jobs");
    expect(skillRows[0]).toHaveTextContent("50.0%");
    expect(skillRows[1]).toHaveTextContent("C++");
    expect(skillRows[1]).toHaveTextContent("1 job");
    expect(skillRows[1]).toHaveTextContent("16.7%");
    expect(
      skills.getByRole("link", { name: "View all insights" }),
    ).toHaveAttribute("href", "/insights");

    const recent = within(
      screen
        .getByRole("heading", { name: "Recent opportunities" })
        .closest("section")!,
    );
    const recentRows = recent.getAllByRole("listitem");
    expect(recentRows[0]).toHaveTextContent("Platform Engineer");
    expect(recentRows[1]).toHaveTextContent("Backend Engineer");
    expect(
      recent.getByRole("link", { name: "Platform Engineer" }),
    ).toHaveAttribute("href", "/jobs/newest");
  });

  it("explains a null response rate instead of presenting zero", async () => {
    mocks.getAnalyticsOverview.mockResolvedValue({
      ...overview,
      response_rate_percentage: null,
    });
    render(await DashboardPage());

    expect(
      screen.getByText("Response rate").nextElementSibling,
    ).toHaveTextContent("No applications yet");
    expect(screen.queryByText("0.0%")).not.toBeInTheDocument();
  });

  it("renders a deliberate no-jobs state", async () => {
    mocks.getAnalyticsOverview.mockResolvedValue({
      ...overview,
      total_jobs: 0,
      applied_jobs: 0,
      interview_jobs: 0,
      response_rate_percentage: null,
      top_skills: [],
      recent_jobs: [],
    });
    render(await DashboardPage());

    expect(screen.getByText(/Track a few jobs/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add job" })).toHaveAttribute(
      "href",
      "/jobs/new",
    );
    expect(screen.queryByText("Total opportunities")).not.toBeInTheDocument();
  });

  it("retains metrics and recent jobs when owned jobs have no skills", async () => {
    mocks.getAnalyticsOverview.mockResolvedValue({
      ...overview,
      top_skills: [],
    });
    render(await DashboardPage());

    expect(screen.getByText("Total opportunities")).toBeInTheDocument();
    expect(screen.getByText("Platform Engineer")).toBeInTheDocument();
    expect(screen.getByText(/Add descriptions or skills/)).toBeInTheDocument();
  });

  it("distinguishes API failure from genuine zero data", async () => {
    mocks.getAnalyticsOverview.mockRejectedValue(
      new Error("secret connection detail"),
    );
    render(await DashboardPage());

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Analytics could not be loaded right now. Please try again later.",
    );
    expect(
      screen.queryByText("secret connection detail"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Track a few jobs/)).not.toBeInTheDocument();
  });

  it("provides an accessible loading state", () => {
    render(<DashboardLoading />);
    expect(
      screen.getByRole("main", { name: "Loading dashboard" }),
    ).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Loading dashboard");
  });
});
