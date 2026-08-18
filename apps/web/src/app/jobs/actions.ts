"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api";
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  createJob,
  deleteJob,
  getJob,
  updateJob,
  updateJobStatus,
} from "@/lib/api/jobs";
import { requireAuthenticatedApiSession } from "@/lib/api/server";
import {
  changedJobFields,
  type JobActionState,
  parseJobForm,
} from "@/lib/jobs/form";

export async function createJobAction(
  _previousState: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  const parsed = parseJobForm(formData);
  if (!parsed.ok) return parsed.state;
  const getAccessToken = await requireAuthenticatedApiSession();
  let jobId: string;
  try {
    jobId = (await createJob(parsed.value, getAccessToken)).id;
  } catch (error) {
    return mutationError(error);
  }
  revalidatePath("/jobs");
  redirect(`/jobs/${jobId}`);
}

export async function updateJobAction(
  jobId: string,
  _previousState: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  const parsed = parseJobForm(formData);
  if (!parsed.ok) return parsed.state;
  const getAccessToken = await requireAuthenticatedApiSession();
  try {
    const current = await getJob(jobId, getAccessToken);
    const changes = changedJobFields(current, parsed.value);
    if (Object.keys(changes).length) {
      await updateJob(jobId, changes, getAccessToken);
    }
  } catch (error) {
    return mutationError(error);
  }
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}`);
}

export async function deleteJobAction(jobId: string): Promise<JobActionState> {
  const getAccessToken = await requireAuthenticatedApiSession();
  try {
    await deleteJob(jobId, getAccessToken);
  } catch (error) {
    return mutationError(
      error,
      "We couldn't delete this job. Please try again.",
    );
  }
  revalidatePath("/jobs");
  redirect("/jobs");
}

export type StatusActionState =
  { success: true } | { success: false; formError: string };

export async function updateJobStatusAction(
  jobId: string,
  submittedStatus: string,
): Promise<StatusActionState> {
  const getAccessToken = await requireAuthenticatedApiSession();
  if (!isApplicationStatus(submittedStatus)) {
    return { success: false, formError: "Choose a valid application status." };
  }
  try {
    await updateJobStatus(jobId, submittedStatus, getAccessToken);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 409) {
        return {
          success: false,
          formError: "This job already has that status.",
        };
      }
      if (error.status === 422) {
        return {
          success: false,
          formError: "Choose a valid application status.",
        };
      }
      if (error.status === 404) {
        return {
          success: false,
          formError: "This job is no longer available.",
        };
      }
    }
    return {
      success: false,
      formError: "We couldn't update this status. Please try again.",
    };
  }
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  return { success: true };
}

function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}

function mutationError(
  error: unknown,
  fallback = "We couldn't save this job. Please try again.",
): JobActionState {
  if (error instanceof ApiError && error.status === 422) {
    return {
      success: false,
      formError: "Check the job details and try again.",
    };
  }
  return { success: false, formError: fallback };
}
