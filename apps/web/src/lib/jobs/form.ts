import {
  type EmploymentType,
  type JobRead,
  type JobUpdateInput,
  type JobWriteInput,
  type WorkArrangement,
} from "@/lib/api/jobs";

export type JobField =
  | "company_name"
  | "title"
  | "description"
  | "job_url"
  | "location"
  | "work_arrangement"
  | "employment_type";

export type JobActionState = {
  success: false;
  fieldErrors?: Partial<Record<JobField, string>>;
  formError?: string;
};

export const initialJobActionState: JobActionState = { success: false };

const workArrangements = new Set<WorkArrangement>([
  "UNKNOWN",
  "REMOTE",
  "HYBRID",
  "ONSITE",
]);
const employmentTypes = new Set<EmploymentType>([
  "UNKNOWN",
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
]);

export function parseJobForm(
  formData: FormData,
):
  | { ok: true; value: Required<JobWriteInput> }
  | { ok: false; state: JobActionState } {
  const companyName = collapseWhitespace(read(formData, "company_name"));
  const title = read(formData, "title").trim();
  const description = nullable(read(formData, "description"));
  const jobUrl = nullable(read(formData, "job_url"));
  const location = nullable(read(formData, "location"));
  const workArrangement = read(formData, "work_arrangement");
  const employmentType = read(formData, "employment_type");
  const fieldErrors: Partial<Record<JobField, string>> = {};

  if (!companyName) fieldErrors.company_name = "Enter a company name.";
  else if (companyName.length > 150)
    fieldErrors.company_name = "Company name must be 150 characters or fewer.";
  if (!title) fieldErrors.title = "Enter a job title.";
  else if (title.length > 200)
    fieldErrors.title = "Job title must be 200 characters or fewer.";
  if (description && description.length > 100_000)
    fieldErrors.description =
      "Description must be 100,000 characters or fewer.";
  if (location && location.length > 200)
    fieldErrors.location = "Location must be 200 characters or fewer.";
  if (jobUrl && !isHttpUrl(jobUrl))
    fieldErrors.job_url = "Enter a valid HTTP or HTTPS URL.";
  if (!workArrangements.has(workArrangement as WorkArrangement))
    fieldErrors.work_arrangement = "Choose a valid work arrangement.";
  if (!employmentTypes.has(employmentType as EmploymentType))
    fieldErrors.employment_type = "Choose a valid employment type.";

  if (Object.keys(fieldErrors).length)
    return { ok: false, state: { success: false, fieldErrors } };

  return {
    ok: true,
    value: {
      company_name: companyName,
      title,
      description,
      job_url: jobUrl,
      location,
      work_arrangement: workArrangement as WorkArrangement,
      employment_type: employmentType as EmploymentType,
    },
  };
}

export function changedJobFields(
  current: JobRead,
  submitted: Required<JobWriteInput>,
): JobUpdateInput {
  const currentValues: Required<JobWriteInput> = {
    company_name: current.company.name,
    title: current.title,
    description: current.description,
    job_url: current.job_url,
    location: current.location,
    work_arrangement: current.work_arrangement,
    employment_type: current.employment_type,
  };
  return Object.fromEntries(
    Object.entries(submitted).filter(
      ([key, value]) => currentValues[key as keyof JobWriteInput] !== value,
    ),
  ) as JobUpdateInput;
}

function read(formData: FormData, name: JobField) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function collapseWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function nullable(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
