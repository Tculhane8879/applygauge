import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type JobRead } from "@/lib/api/jobs";

import { JobList } from "./job-list";

const job: JobRead = {
  id: "11111111-1111-4111-8111-111111111111",
  company: { id: "company-id", name: "Acme" },
  title: "Software Engineer",
  job_url: null,
  location: "Seattle, WA",
  work_arrangement: "HYBRID",
  employment_type: "FULL_TIME",
  current_status: "SCREENING",
  description: null,
  created_at: "2026-08-17T12:00:00Z",
  updated_at: "2026-08-17T12:00:00Z",
};

describe("JobList", () => {
  it("renders a useful empty state without an unavailable action", () => {
    render(<JobList jobs={[]} />);

    expect(
      screen.getByRole("heading", { name: "No saved jobs yet" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders compact job information and a detail link", () => {
    render(<JobList jobs={[job]} />);

    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Seattle, WA")).toBeInTheDocument();
    expect(screen.getByText("Hybrid")).toBeInTheDocument();
    expect(screen.getByText("Full-time")).toBeInTheDocument();
    expect(screen.getByText("Screening")).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: /status/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/jobs/11111111-1111-4111-8111-111111111111",
    );
  });

  it("omits a missing optional location cleanly", () => {
    render(<JobList jobs={[{ ...job, location: null }]} />);

    expect(screen.queryByText("Seattle, WA")).not.toBeInTheDocument();
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
  });
});
