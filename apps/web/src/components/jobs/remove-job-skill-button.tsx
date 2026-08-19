"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { type SkillActionState } from "@/app/jobs/actions";
import { Button } from "@/components/ui/button";

export function RemoveJobSkillButton({
  action,
  skillName,
}: {
  action: () => Promise<SkillActionState>;
  skillName: string;
}) {
  const router = useRouter();
  const errorId = useId();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <div className="min-w-0">
      <Button
        aria-describedby={error ? errorId : undefined}
        disabled={pending}
        onClick={() => {
          if (pending) return;
          startTransition(async () => {
            setError(undefined);
            const result = await action();
            if (!result.success) {
              setError(result.formError);
              return;
            }
            router.refresh();
          });
        }}
        size="compact"
        variant="destructive-subtle"
      >
        {pending ? `Removing ${skillName}…` : `Remove ${skillName}`}
      </Button>
      {error ? (
        <p
          className="mt-1 break-words text-sm text-red-700"
          id={errorId}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
