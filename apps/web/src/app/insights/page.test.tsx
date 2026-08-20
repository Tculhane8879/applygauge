import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSkillInsights: vi.fn(),
  requireAuthenticatedApiSession: vi.fn(),
}));
vi.mock("@/lib/api/analytics", () => ({
  getSkillInsights: mocks.getSkillInsights,
}));
vi.mock("@/lib/api/server", () => ({
  requireAuthenticatedApiSession: mocks.requireAuthenticatedApiSession,
}));
vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: () => <button>Sign out</button>,
}));

import InsightsLoading from "./loading";
import InsightsPage from "./page";

const response = {
  total_jobs: 4,
  items: [
    {
      id: "python",
      name: "Python",
      category: "LANGUAGE" as const,
      job_count: 3,
      job_percentage: 75,
    },
    {
      id: "cpp",
      name: "C++",
      category: "LANGUAGE" as const,
      job_count: 1,
      job_percentage: 25,
    },
  ],
};

describe("InsightsPage", () => {
  const tokenProvider = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedApiSession.mockResolvedValue(tokenProvider);
    mocks.getSkillInsights.mockResolvedValue(response);
  });

  it("fetches as an authenticated Server Component and preserves the complete ranking", async () => {
    render(await InsightsPage());

    expect(mocks.requireAuthenticatedApiSession).toHaveBeenCalledOnce();
    expect(mocks.getSkillInsights).toHaveBeenCalledWith(tokenProvider);
    expect(
      screen.getByRole("heading", { name: "Insights", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/skills appear most often/)).toBeInTheDocument();
    const rows = screen.getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("01Python");
    expect(rows[0]).toHaveTextContent("3 jobs");
    expect(rows[0]).toHaveTextContent("75.0%");
    expect(rows[1]).toHaveTextContent("02C++");
    expect(rows[1]).toHaveTextContent("1 job");
    expect(rows[1]).toHaveTextContent("25.0%");
  });

  it("has no analytics filter, threshold, search, or form control", async () => {
    render(await InsightsPage());
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/minimum|threshold|filter/i),
    ).not.toBeInTheDocument();
  });

  it("renders a no-jobs state with an Add job action", async () => {
    mocks.getSkillInsights.mockResolvedValue({ total_jobs: 0, items: [] });
    render(await InsightsPage());
    expect(
      screen.getByRole("heading", { name: "No jobs to analyze yet" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add job" })).toHaveAttribute(
      "href",
      "/jobs/new",
    );
  });

  it("distinguishes jobs without skills from no jobs", async () => {
    mocks.getSkillInsights.mockResolvedValue({ total_jobs: 3, items: [] });
    render(await InsightsPage());
    expect(screen.getByText(/Add descriptions or skills/)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Add job" }),
    ).not.toBeInTheDocument();
  });

  it("renders a safe API error instead of an empty ranking", async () => {
    mocks.getSkillInsights.mockRejectedValue(new Error("private failure"));
    render(await InsightsPage());
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Insights could not be loaded right now. Please try again later.",
    );
    expect(screen.queryByText("private failure")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Add descriptions or skills/),
    ).not.toBeInTheDocument();
  });

  it("provides an accessible loading state", () => {
    render(<InsightsLoading />);
    expect(
      screen.getByRole("main", { name: "Loading insights" }),
    ).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Loading insights");
  });
});
