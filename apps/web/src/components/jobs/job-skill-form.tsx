"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { type SkillActionState } from "@/app/jobs/actions";

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
      className="mt-5 max-w-sm"
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
      <label
        className="block text-sm font-semibold text-slate-800"
        htmlFor={inputId}
      >
        Skill name
      </label>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:cursor-wait disabled:bg-slate-100"
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
      {error ? (
        <p className="mt-2 text-sm text-red-700" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="mt-3 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Adding…" : "Add skill"}
      </button>
    </form>
  );
}
