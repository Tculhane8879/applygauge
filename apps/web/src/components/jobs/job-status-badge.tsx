import { type ApplicationStatus } from "@/lib/api/jobs";
import { applicationStatusLabel } from "@/lib/jobs/presentation";

export function JobStatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800">
      {applicationStatusLabel(status)}
    </span>
  );
}
