"use client";

import { useState } from "react";

import { validateSignup, type ValidationErrors } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";

import { Field } from "./login-form";
import { SubmitButton } from "./submit-button";

export function SignupForm() {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [confirmationRequired, setConfirmationRequired] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    const validation = validateSignup(email, password, confirmPassword);
    setErrors(validation);
    setFormError(undefined);
    if (Object.keys(validation).length) return;

    setPending(true);
    const { error } = await createClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    if (error) {
      setFormError(
        "Unable to create the account. Please review your details and try again.",
      );
      setPending(false);
      return;
    }
    setConfirmationRequired(true);
    setPending(false);
  }

  if (confirmationRequired) {
    return (
      <div
        className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900"
        role="status"
      >
        Check your email to confirm your account, then continue to ApplyGauge.
      </div>
    );
  }

  return (
    <form className="space-y-4" noValidate onSubmit={submit}>
      <Field label="Email" name="email" type="email" error={errors.email} />
      <Field
        label="Password"
        name="password"
        type="password"
        error={errors.password}
      />
      <Field
        label="Confirm password"
        name="confirmPassword"
        type="password"
        error={errors.confirmPassword}
      />
      {formError && (
        <p className="text-sm text-red-700" role="alert">
          {formError}
        </p>
      )}
      <SubmitButton label="Create account" pending={pending} />
    </form>
  );
}
