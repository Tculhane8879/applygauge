import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type JobRead } from "@/lib/api/jobs";

import { JobDetail } from "./job-detail";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const job: JobRead = {
  id: "job-id",
  company: { id: "company-id", name: "Acme" },
  title: "Software Engineer",
  job_url: "https://example.test/jobs/1",
  location: "Seattle, WA",
  work_arrangement: "ONSITE",
  employment_type: "CONTRACT",
  current_status: "APPLIED",
  description: "First line\nSecond line",
  created_at: "2026-08-17T12:00:00Z",
  updated_at: "2026-08-18T14:30:00Z",
};

describe("JobDetail", () => {
  it("renders job data with readable labels and a safe external link", () => {
    render(
      <JobDetail
        addSkillAction={vi.fn()}
        deleteAction={async () => ({ success: false })}
        history={[]}
        job={job}
        removeSkillAction={vi.fn()}
        skills={[]}
        statusAction={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: job.title }),
    ).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("On-site")).toBeInTheDocument();
    expect(screen.getByText("Contract")).toBeInTheDocument();
    expect(screen.getAllByText("Applied")).toHaveLength(2);
    expect(
      screen.getByRole("combobox", { name: "Application status" }),
    ).toHaveValue("APPLIED");
    expect(screen.getByText(/First line/)).toHaveClass("whitespace-pre-wrap");
    const link = screen.getByRole("link", { name: /View job posting/ });
    expect(link).toHaveAttribute("href", job.job_url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/jobs/job-id/edit",
    );
    const deleteHeading = screen.getByRole("heading", {
      name: "Delete this opportunity",
    });
    expect(
      screen.getByRole("button", { name: "Delete job" }),
    ).toBeInTheDocument();
    expect(
      deleteHeading.compareDocumentPosition(
        screen.getByRole("heading", { name: "Status history" }),
      ) & Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();
  });

  it("handles all nullable display fields without broken output", () => {
    render(
      <JobDetail
        addSkillAction={vi.fn()}
        deleteAction={async () => ({ success: false })}
        history={[]}
        job={{ ...job, job_url: null, location: null, description: null }}
        removeSkillAction={vi.fn()}
        skills={[]}
        statusAction={vi.fn()}
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

  it("renders long content in full without adding truncation semantics", () => {
    const longTitle =
      "Senior Staff Distributed Systems and Developer Infrastructure Software Engineer";
    const longCompany =
      "International Consortium for Reliable Developer Infrastructure and Distributed Computing";
    const longLocation =
      "Remote across the continental United States with quarterly collaboration in San Francisco, California";
    const longDescription =
      "Build reliable systems across teams.\n\nOwn SuperLongUnbrokenTechnicalIdentifierWithManySegmentsAndNoSpaces end to end.";
    const longUrl =
      "https://example.test/opportunities/distributed-systems?department=developer-infrastructure&source=applygauge";

    render(
      <JobDetail
        addSkillAction={vi.fn()}
        deleteAction={async () => ({ success: false })}
        history={[]}
        job={{
          ...job,
          company: { ...job.company, name: longCompany },
          description: longDescription,
          job_url: longUrl,
          location: longLocation,
          title: longTitle,
        }}
        removeSkillAction={vi.fn()}
        skills={[]}
        statusAction={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: longTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(longCompany)).toBeInTheDocument();
    expect(screen.getByText(longLocation)).toBeInTheDocument();
    expect(screen.getByText(/SuperLongUnbroken/)).toHaveClass("break-words");
    expect(
      screen.getByRole("link", { name: /View job posting/ }),
    ).toHaveAttribute("href", longUrl);
  });
});
