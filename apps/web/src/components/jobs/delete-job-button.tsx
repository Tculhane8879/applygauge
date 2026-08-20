"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { type JobActionState } from "@/lib/jobs/form";

export function DeleteJobButton({
  action,
}: {
  action: () => Promise<JobActionState>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const hasOpenedConfirmation = useRef(false);

  useEffect(() => {
    if (!hasOpenedConfirmation.current) return;

    if (confirming) {
      confirmRef.current?.focus();
    } else {
      triggerRef.current?.focus();
    }
  }, [confirming]);

  if (!confirming) {
    return (
      <Button
        aria-expanded="false"
        onClick={() => {
          hasOpenedConfirmation.current = true;
          setConfirming(true);
        }}
        ref={triggerRef}
        size="compact"
        variant="destructive-subtle"
      >
        Delete job
      </Button>
    );
  }

  return (
    <div
      aria-label="Delete job confirmation"
      className="max-w-md rounded-lg border border-line bg-surface-muted p-3"
      role="group"
    >
      <p className="font-semibold text-ink">Delete this job?</p>
      <p className="mt-0.5 text-sm text-muted">This can&apos;t be undone.</p>
      {error ? (
        <p className="mt-2 break-words text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(undefined);
              const result = await action();
              setError(result.formError);
            })
          }
          size="compact"
          variant="destructive"
          ref={confirmRef}
        >
          {pending ? "Deleting…" : "Delete job"}
        </Button>
        <Button
          disabled={pending}
          onClick={() => setConfirming(false)}
          size="compact"
          variant="secondary"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
