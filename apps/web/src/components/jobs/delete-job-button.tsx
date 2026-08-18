"use client";

import { useState, useTransition } from "react";

import { type JobActionState } from "@/lib/jobs/form";

export function DeleteJobButton({
  action,
}: {
  action: () => Promise<JobActionState>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        className="font-semibold text-red-700 hover:underline"
        onClick={() => setConfirming(true)}
        type="button"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="font-medium text-red-950">Delete this saved job?</p>
      <p className="mt-1 text-sm text-red-800">This action cannot be undone.</p>
      {error ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex gap-3">
        <button
          className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white disabled:cursor-wait disabled:opacity-60"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(undefined);
              const result = await action();
              setError(result.formError);
            })
          }
          type="button"
        >
          {pending ? "Deleting…" : "Confirm delete"}
        </button>
        <button
          className="rounded-lg px-4 py-2 font-semibold text-slate-700 hover:bg-white"
          disabled={pending}
          onClick={() => setConfirming(false)}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
