"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { type SkillActionState } from "@/app/jobs/actions";
import { Button } from "@/components/ui/button";

export function JobSkillForm({
  action,
}: {
  action: (name: string) => Promise<SkillActionState>;
}) {
  const router = useRouter();
  const inputId = useId();
  const errorId = useId();
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-5 max-w-xl"
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        startTransition(async () => {
          setError(undefined);
          const result = await action(name);
          if (!result.success) {
            setError(result.formError);
            return;
          }
          setName("");
          router.refresh();
        });
      }}
    >
      <label className="block text-sm font-semibold text-ink" htmlFor={inputId}>
        Skill name
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          className="form-control sm:max-w-sm"
          disabled={pending}
          id={inputId}
          maxLength={100}
          onChange={(event) => {
            setName(event.target.value);
            setError(undefined);
          }}
          type="text"
          value={name}
        />
        <Button disabled={pending} type="submit">
          {pending ? "Adding…" : "Add skill"}
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
