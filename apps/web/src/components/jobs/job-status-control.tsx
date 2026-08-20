"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/api/jobs";
import { applicationStatusLabel } from "@/lib/jobs/presentation";

export function JobStatusControl({
  action,
  currentStatus,
}: {
  action: (
    status: string,
  ) => Promise<{ success: true } | { success: false; formError: string }>;
  currentStatus: ApplicationStatus;
}) {
  const router = useRouter();
  const selectId = useId();
  const errorId = useId();
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const isNoOp = selectedStatus === currentStatus;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (isNoOp || pending) return;
        startTransition(async () => {
          setError(undefined);
          const result = await action(selectedStatus);
          if (!result.success) {
            setError(result.formError);
            return;
          }
          router.refresh();
        });
      }}
    >
      <label className="sr-only" htmlFor={selectId}>
        Application status
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          className="form-control sm:max-w-xs"
          disabled={pending}
          id={selectId}
          onChange={(event) => {
            setSelectedStatus(event.target.value as ApplicationStatus);
            setError(undefined);
          }}
          value={selectedStatus}
        >
          {APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {applicationStatusLabel(status)}
            </option>
          ))}
        </select>
        <Button disabled={pending || isNoOp} type="submit">
          {pending ? "Updating…" : "Update status"}
        </Button>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-danger" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
