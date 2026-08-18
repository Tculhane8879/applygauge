import { type AccessTokenProvider, authenticatedApiFetch } from "@/lib/api";

export type WorkArrangement = "UNKNOWN" | "REMOTE" | "HYBRID" | "ONSITE";
export type EmploymentType =
  "UNKNOWN" | "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
export const APPLICATION_STATUSES = [
  "SAVED",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

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
  current_status: ApplicationStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type JobListResponse = {
  items: JobRead[];
};

export type StatusEventRead = {
  id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_at: string;
};

export type StatusEventListResponse = {
  items: StatusEventRead[];
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

export function getStatusEvents(
  jobId: string,
  getAccessToken: AccessTokenProvider,
) {
  return authenticatedApiFetch<StatusEventListResponse>(
    `/api/v1/jobs/${encodeURIComponent(jobId)}/status-events`,
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

export function updateJobStatus(
  jobId: string,
  status: ApplicationStatus,
  getAccessToken: AccessTokenProvider,
) {
  return authenticatedApiFetch<JobRead>(
    `/api/v1/jobs/${encodeURIComponent(jobId)}/status`,
    getAccessToken,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
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
