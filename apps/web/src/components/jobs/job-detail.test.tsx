import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type JobRead } from "@/lib/api/jobs";

import { JobDetail } from "./job-detail";

const job: JobRead = {
  id: "job-id",
  company: { id: "company-id", name: "Acme" },
  title: "Software Engineer",
  job_url: "https://example.test/jobs/1",
  location: "Seattle, WA",
  work_arrangement: "ONSITE",
  employment_type: "CONTRACT",
  description: "First line\nSecond line",
  created_at: "2026-08-17T12:00:00Z",
  updated_at: "2026-08-18T14:30:00Z",
};

describe("JobDetail", () => {
  it("renders job data with readable labels and a safe external link", () => {
    render(
      <JobDetail deleteAction={async () => ({ success: false })} job={job} />,
    );

    expect(
      screen.getByRole("heading", { name: job.title }),
    ).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("On-site")).toBeInTheDocument();
    expect(screen.getByText("Contract")).toBeInTheDocument();
    expect(screen.getByText(/First line/)).toHaveClass("whitespace-pre-wrap");
    const link = screen.getByRole("link", { name: /View job posting/ });
    expect(link).toHaveAttribute("href", job.job_url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/jobs/job-id/edit",
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("handles all nullable display fields without broken output", () => {
    render(
      <JobDetail
        deleteAction={async () => ({ success: false })}
        job={{ ...job, job_url: null, location: null, description: null }}
      />,
    );

    expect(
      screen.queryByRole("link", { name: /View job posting/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Seattle, WA")).not.toBeInTheDocument();
    expect(
      screen.getByText("No description was saved for this job."),
    ).toBeInTheDocument();
  });
});
