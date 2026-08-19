import {
  type ApplicationStatus,
  type EmploymentType,
  type SkillSource,
  type WorkArrangement,
} from "@/lib/api/jobs";

const applicationStatusLabels: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

const workArrangementLabels: Record<WorkArrangement, string> = {
  UNKNOWN: "Unknown",
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "On-site",
};

const employmentTypeLabels: Record<EmploymentType, string> = {
  UNKNOWN: "Unknown",
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function workArrangementLabel(value: WorkArrangement) {
  return workArrangementLabels[value];
}

export function employmentTypeLabel(value: EmploymentType) {
  return employmentTypeLabels[value];
}

export function applicationStatusLabel(value: ApplicationStatus) {
  return applicationStatusLabels[value];
}

export function formatJobDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function formatJobDateTime(value: string) {
  return `${dateTimeFormatter.format(new Date(value))} UTC`;
}

export function getSkillSourceLabel(sources: SkillSource[]) {
  if (sources.length === 1 && sources[0] === "MANUAL") {
    return "Manual";
  }
  if (sources.length === 1 && sources[0] === "DETECTED") {
    return "Detected";
  }
  if (
    sources.length === 2 &&
    sources[0] === "MANUAL" &&
    sources[1] === "DETECTED"
  ) {
    return "Manual + detected";
  }
  return "Unknown source";
}
