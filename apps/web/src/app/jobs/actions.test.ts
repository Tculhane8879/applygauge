import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api";
import { initialJobActionState } from "@/lib/jobs/form";

const mocks = vi.hoisted(() => ({
  addJobSkill: vi.fn(),
  createJob: vi.fn(),
  deleteJob: vi.fn(),
  getJob: vi.fn(),
  updateJob: vi.fn(),
  updateJobStatus: vi.fn(),
  requireSession: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  removeJobSkill: vi.fn(),
}));
vi.mock("@/lib/api/jobs", () => ({
  APPLICATION_STATUSES: [
    "SAVED",
    "APPLIED",
    "SCREENING",
    "INTERVIEW",
    "OFFER",
    "REJECTED",
    "WITHDRAWN",
  ],
  addJobSkill: mocks.addJobSkill,
  createJob: mocks.createJob,
  deleteJob: mocks.deleteJob,
  getJob: mocks.getJob,
  removeJobSkill: mocks.removeJobSkill,
  updateJob: mocks.updateJob,
  updateJobStatus: mocks.updateJobStatus,
}));
vi.mock("@/lib/api/server", () => ({
  requireAuthenticatedApiSession: mocks.requireSession,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import {
  addJobSkillAction,
  createJobAction,
  deleteJobAction,
  removeJobSkillAction,
  updateJobAction,
  updateJobStatusAction,
} from "./actions";

function validForm(overrides: Record<string, string> = {}) {
  const values = {
    company_name: "Acme",
    title: "Engineer",
    description: "Description",
    job_url: "https://example.test/job",
    location: "Seattle",
    work_arrangement: "REMOTE",
    employment_type: "FULL_TIME",
    ...overrides,
  };
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

const currentJob = {
  id: "job-id",
  company: { id: "company-id", name: "Acme" },
  title: "Engineer",
  description: "Description",
  job_url: "https://example.test/job",
  location: "Seattle",
  work_arrangement: "REMOTE",
  employment_type: "FULL_TIME",
  created_at: "2026-08-17T12:00:00Z",
  updated_at: "2026-08-17T12:00:00Z",
};

describe("job Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireSession.mockResolvedValue(vi.fn());
  });

  it("validates create input before authenticating", async () => {
    const result = await createJobAction(
      initialJobActionState,
      validForm({ title: "" }),
    );
    expect(result.fieldErrors?.title).toBe("Enter a job title.");
    expect(mocks.requireSession).not.toHaveBeenCalled();
  });

  it("creates, revalidates, and redirects to persisted detail", async () => {
    mocks.createJob.mockResolvedValue({ id: "created-id" });
    await expect(
      createJobAction(initialJobActionState, validForm()),
    ).rejects.toThrow("REDIRECT:/jobs/created-id");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/jobs");
  });

  it("maps backend validation to a safe form error", async () => {
    mocks.createJob.mockRejectedValue(new ApiError(422));
    await expect(
      createJobAction(initialJobActionState, validForm()),
    ).resolves.toEqual({
      success: false,
      formError: "Check the job details and try again.",
    });
  });

  it("re-reads the job and PATCHes only changed and cleared fields", async () => {
    mocks.getJob.mockResolvedValue(currentJob);
    mocks.updateJob.mockResolvedValue({
      ...currentJob,
      title: "Senior Engineer",
    });
    await expect(
      updateJobAction(
        "job-id",
        initialJobActionState,
        validForm({ title: "Senior Engineer", description: "", location: "" }),
      ),
    ).rejects.toThrow("REDIRECT:/jobs/job-id");
    expect(mocks.updateJob).toHaveBeenCalledWith(
      "job-id",
      { title: "Senior Engineer", description: null, location: null },
      expect.any(Function),
    );
  });

  it("does not issue an empty PATCH when nothing changed", async () => {
    mocks.getJob.mockResolvedValue(currentJob);
    await expect(
      updateJobAction("job-id", initialJobActionState, validForm()),
    ).rejects.toThrow("REDIRECT:/jobs/job-id");
    expect(mocks.updateJob).not.toHaveBeenCalled();
  });

  it("deletes, revalidates, and redirects to the list", async () => {
    await expect(deleteJobAction("job-id")).rejects.toThrow("REDIRECT:/jobs");
    expect(mocks.deleteJob).toHaveBeenCalledWith(
      "job-id",
      expect.any(Function),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/jobs");
  });

  it("returns a safe delete failure without redirecting", async () => {
    mocks.deleteJob.mockRejectedValue(new Error("database detail"));
    await expect(deleteJobAction("job-id")).resolves.toEqual({
      success: false,
      formError: "We couldn't delete this job. Please try again.",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("authenticates, updates status, and revalidates list and detail", async () => {
    await expect(updateJobStatusAction("job-id", "APPLIED")).resolves.toEqual({
      success: true,
    });
    expect(mocks.requireSession).toHaveBeenCalledOnce();
    expect(mocks.updateJobStatus).toHaveBeenCalledWith(
      "job-id",
      "APPLIED",
      expect.any(Function),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/jobs");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/jobs/job-id");
  });

  it("rejects invalid status without calling the API", async () => {
    await expect(updateJobStatusAction("job-id", "INVALID")).resolves.toEqual({
      success: false,
      formError: "Choose a valid application status.",
    });
    expect(mocks.requireSession).toHaveBeenCalledOnce();
    expect(mocks.updateJobStatus).not.toHaveBeenCalled();
  });

  it.each([
    [409, "This job already has that status."],
    [422, "Choose a valid application status."],
    [404, "This job is no longer available."],
  ])("maps API %s to a safe status error", async (status, formError) => {
    mocks.updateJobStatus.mockRejectedValueOnce(new ApiError(status));
    await expect(updateJobStatusAction("job-id", "APPLIED")).resolves.toEqual({
      success: false,
      formError,
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("maps unexpected status failures without leaking details", async () => {
    mocks.updateJobStatus.mockRejectedValueOnce(new Error("sensitive detail"));
    await expect(updateJobStatusAction("job-id", "APPLIED")).resolves.toEqual({
      success: false,
      formError: "We couldn't update this status. Please try again.",
    });
  });

  it("adds a skill and revalidates only the detail route", async () => {
    await expect(addJobSkillAction("job-id", "postgres")).resolves.toEqual({
      success: true,
    });
    expect(mocks.addJobSkill).toHaveBeenCalledWith(
      "job-id",
      "postgres",
      expect.any(Function),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/jobs/job-id");
    expect(mocks.revalidatePath).not.toHaveBeenCalledWith("/jobs");
  });

  it.each(["", " ", "a".repeat(101), "bad\u0000name"])(
    "rejects invalid skill input without calling the API: %j",
    async (name) => {
      await expect(addJobSkillAction("job-id", name)).resolves.toEqual({
        success: false,
        formError: "Enter a valid skill name.",
      });
      expect(mocks.addJobSkill).not.toHaveBeenCalled();
    },
  );

  it.each([
    [422, "That skill isn't available in the catalog yet."],
    [404, "This job is no longer available."],
  ])("maps API %s to a safe add-skill error", async (status, formError) => {
    mocks.addJobSkill.mockRejectedValueOnce(new ApiError(status));
    await expect(addJobSkillAction("job-id", "Python")).resolves.toEqual({
      success: false,
      formError,
    });
  });

  it("removes a skill and revalidates only the detail route", async () => {
    await expect(removeJobSkillAction("job-id", "skill-id")).resolves.toEqual({
      success: true,
    });
    expect(mocks.removeJobSkill).toHaveBeenCalledWith(
      "job-id",
      "skill-id",
      expect.any(Function),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/jobs/job-id");
    expect(mocks.revalidatePath).not.toHaveBeenCalledWith("/jobs");
  });

  it("maps remove 404 without exposing ownership", async () => {
    mocks.removeJobSkill.mockRejectedValueOnce(new ApiError(404));
    await expect(removeJobSkillAction("job-id", "skill-id")).resolves.toEqual({
      success: false,
      formError: "This job is no longer available.",
    });
  });

  it.each([
    ["add", mocks.addJobSkill, () => addJobSkillAction("job-id", "Python")],
    [
      "remove",
      mocks.removeJobSkill,
      () => removeJobSkillAction("job-id", "skill-id"),
    ],
  ])(
    "maps unexpected %s failures without leaking details",
    async (_kind, mutation, action) => {
      mutation.mockRejectedValueOnce(new Error("sensitive detail"));
      await expect(action()).resolves.toEqual({
        success: false,
        formError: "We couldn't update these skills. Please try again.",
      });
    },
  );
});
