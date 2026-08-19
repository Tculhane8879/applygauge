import { type ApplicationStatus } from "@/lib/api/jobs";
import { applicationStatusLabel } from "@/lib/jobs/presentation";

const statusClasses: Record<ApplicationStatus, string> = {
  SAVED: "text-stone-700",
  APPLIED: "text-blue-700",
  SCREENING: "text-violet-700",
  INTERVIEW: "text-amber-700",
  OFFER: "text-emerald-700",
  REJECTED: "text-red-700",
  WITHDRAWN: "text-gray-600",
};

export function JobStatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex text-sm font-semibold ${statusClasses[status]}`}
      data-status={status}
    >
      {applicationStatusLabel(status)}
    </span>
  );
}
