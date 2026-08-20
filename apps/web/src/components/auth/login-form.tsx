"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { validateLogin, type ValidationErrors } from "@/lib/auth/validation";

import { SubmitButton } from "./submit-button";

export function LoginForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const validation = validateLogin(email, password);
    setErrors(validation);
    setFormError(undefined);
    if (Object.keys(validation).length) return;

    setPending(true);
    const { error } = await createClient().auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setFormError("Unable to sign in with those credentials.");
      setPending(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-4" noValidate onSubmit={submit}>
      <Field
        autoComplete="email"
        label="Email"
        name="email"
        type="email"
        error={errors.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        error={errors.password}
      />
      {formError && (
        <p className="break-words text-sm text-red-700" role="alert">
          {formError}
        </p>
      )}
      <SubmitButton label="Sign in" pending={pending} />
    </form>
  );
}

export function Field({
  label,
  name,
  type,
  error,
  autoComplete,
}: {
  label: string;
  name: string;
  type: string;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <input
        aria-describedby={error ? `${name}-error` : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className="form-control mt-1"
        name={name}
        type={type}
      />
      {error && (
        <span
          className="mt-1 block break-words text-red-700"
          id={`${name}-error`}
        >
          {error}
        </span>
      )}
    </label>
  );
}
