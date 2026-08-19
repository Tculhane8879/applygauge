"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { type SkillActionState } from "@/app/jobs/actions";

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
    <div>
      <button
        aria-describedby={error ? errorId : undefined}
        className="text-sm font-semibold text-red-700 hover:underline disabled:cursor-wait disabled:opacity-60"
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
        type="button"
      >
        {pending ? `Removing ${skillName}…` : `Remove ${skillName}`}
      </button>
      {error ? (
        <p className="mt-1 text-sm text-red-700" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
