import { describe, expect, it } from "vitest";

import { type JobRead } from "@/lib/api/jobs";

import { changedJobFields, parseJobForm } from "./form";

function form(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

const valid = {
  company_name: "  Acme   Corp ",
  title: " Engineer ",
  description: "Description",
  job_url: "https://example.test/job",
  location: "Seattle",
  work_arrangement: "REMOTE",
  employment_type: "FULL_TIME",
};

const job: JobRead = {
  id: "job-id",
  company: { id: "company-id", name: "Acme Corp" },
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

describe("job form normalization", () => {
  it("normalizes valid values and defaults nullable blanks to null", () => {
    const result = parseJobForm(
      form({ ...valid, description: " ", job_url: "", location: "" }),
    );
    expect(result).toEqual({
      ok: true,
      value: {
        company_name: "Acme Corp",
        title: "Engineer",
        description: null,
        job_url: null,
        location: null,
        work_arrangement: "REMOTE",
        employment_type: "FULL_TIME",
      },
    });
  });

  it("rejects required blanks and a non-HTTP URL", () => {
    const result = parseJobForm(
      form({ ...valid, company_name: " ", title: "", job_url: "ftp://bad" }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.state.fieldErrors).toMatchObject({
        company_name: "Enter a company name.",
        title: "Enter a job title.",
        job_url: "Enter a valid HTTP or HTTPS URL.",
      });
    }
  });

  it("produces only changed PATCH fields and preserves explicit clears", () => {
    const parsed = parseJobForm(
      form({
        ...valid,
        title: "Senior Engineer",
        description: "",
        job_url: "",
        location: "",
      }),
    );
    if (!parsed.ok) throw new Error("expected valid form");
    expect(changedJobFields(job, parsed.value)).toEqual({
      title: "Senior Engineer",
      description: null,
      job_url: null,
      location: null,
    });
  });
});
