import { type AccessTokenProvider, authenticatedApiFetch } from "@/lib/api";

export type WorkArrangement = "UNKNOWN" | "REMOTE" | "HYBRID" | "ONSITE";
export type EmploymentType =
  "UNKNOWN" | "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";

export type CompanyRead = {
  id: string;
  name: string;
};

export type JobRead = {
  id: string;
  company: CompanyRead;
  title: string;
  job_url: string | null;
  location: string | null;
  work_arrangement: WorkArrangement;
  employment_type: EmploymentType;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type JobListResponse = {
  items: JobRead[];
};

export type JobWriteInput = {
  company_name: string;
  title: string;
  description?: string | null;
  job_url?: string | null;
  location?: string | null;
  work_arrangement?: WorkArrangement;
  employment_type?: EmploymentType;
};

export type JobUpdateInput = Partial<JobWriteInput>;

export function getJobs(getAccessToken: AccessTokenProvider) {
  return authenticatedApiFetch<JobListResponse>("/api/v1/jobs", getAccessToken);
}

export function getJob(jobId: string, getAccessToken: AccessTokenProvider) {
  return authenticatedApiFetch<JobRead>(
    `/api/v1/jobs/${encodeURIComponent(jobId)}`,
    getAccessToken,
  );
}

export function createJob(
  input: JobWriteInput,
  getAccessToken: AccessTokenProvider,
) {
  return authenticatedApiFetch<JobRead>("/api/v1/jobs", getAccessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateJob(
  jobId: string,
  input: JobUpdateInput,
  getAccessToken: AccessTokenProvider,
) {
  return authenticatedApiFetch<JobRead>(
    `/api/v1/jobs/${encodeURIComponent(jobId)}`,
    getAccessToken,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function deleteJob(jobId: string, getAccessToken: AccessTokenProvider) {
  return authenticatedApiFetch<void>(
    `/api/v1/jobs/${encodeURIComponent(jobId)}`,
    getAccessToken,
    { method: "DELETE" },
  );
}
