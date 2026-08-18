import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type JobRead } from "@/lib/api/jobs";

import { JobForm } from "./job-form";

const job: JobRead = {
  id: "job-id",
  company: { id: "company-id", name: "Acme" },
  title: "Engineer",
  description: "Description",
  job_url: "https://example.test/job",
  location: "Seattle",
  work_arrangement: "REMOTE",
  employment_type: "FULL_TIME",
  current_status: "SAVED",
  created_at: "2026-08-17T12:00:00Z",
  updated_at: "2026-08-17T12:00:00Z",
};

describe("JobForm", () => {
  it("uses unknown enum defaults for create", () => {
    render(<JobForm action={vi.fn()} cancelHref="/jobs" />);
    expect(screen.getByLabelText("Work arrangement")).toHaveValue("UNKNOWN");
    expect(screen.getByLabelText("Employment type")).toHaveValue("UNKNOWN");
    expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();
  });

  it("prepopulates every supported edit field", () => {
    render(<JobForm action={vi.fn()} cancelHref="/jobs/job-id" job={job} />);
    expect(screen.getByLabelText("Company name")).toHaveValue("Acme");
    expect(screen.getByLabelText("Job title")).toHaveValue("Engineer");
    expect(screen.getByLabelText("Description")).toHaveValue("Description");
    expect(screen.getByLabelText("Job URL")).toHaveValue(job.job_url);
    expect(screen.getByLabelText("Location")).toHaveValue("Seattle");
    expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();
  });

  it("displays action field and form errors", async () => {
    const action = vi.fn().mockResolvedValue({
      success: false,
      fieldErrors: { company_name: "Enter a company name." },
      formError: "Check the job details and try again.",
    });
    render(<JobForm action={action} cancelHref="/jobs" />);
    fireEvent.submit(
      screen.getByRole("button", { name: "Add job" }).closest("form")!,
    );
    expect(
      await screen.findByText("Enter a company name."),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Check the job details",
    );
    expect(screen.getByLabelText("Company name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("disables duplicate submissions while saving", async () => {
    let resolve!: (value: { success: false }) => void;
    const action = vi
      .fn()
      .mockReturnValue(new Promise((done) => (resolve = done)));
    render(<JobForm action={action} cancelHref="/jobs" />);
    fireEvent.submit(
      screen.getByRole("button", { name: "Add job" }).closest("form")!,
    );
    expect(
      await screen.findByRole("button", { name: "Saving…" }),
    ).toBeDisabled();
    resolve({ success: false });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add job" })).toBeEnabled(),
    );
  });
});
