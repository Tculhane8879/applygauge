"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
      className="rounded-xl border border-slate-200 bg-white p-4"
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
      <label
        className="block text-sm font-semibold text-slate-800"
        htmlFor={selectId}
      >
        Application status
      </label>
      <select
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:cursor-wait disabled:bg-slate-100"
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
      {error ? (
        <p className="mt-2 text-sm text-red-700" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="mt-3 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending || isNoOp}
        type="submit"
      >
        {pending ? "Updating…" : "Update status"}
      </button>
    </form>
  );
}
