"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonStyles } from "@/components/ui/button";
import { type JobRead } from "@/lib/api/jobs";
import {
  initialJobActionState,
  type JobActionState,
  type JobField,
} from "@/lib/jobs/form";

type JobFormAction = (
  state: JobActionState,
  formData: FormData,
) => Promise<JobActionState>;

export function JobForm({
  action,
  job,
  cancelHref,
}: {
  action: JobFormAction;
  job?: JobRead;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialJobActionState,
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div className="max-w-3xl space-y-8">
        <fieldset>
          <legend className="text-lg font-semibold text-ink">
            Opportunity details
          </legend>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <TextField
              defaultValue={job?.company.name}
              error={errors.company_name}
              label="Company name"
              maxLength={150}
              name="company_name"
              required
            />
            <TextField
              defaultValue={job?.title}
              error={errors.title}
              label="Job title"
              maxLength={200}
              name="title"
              required
            />
            <TextField
              defaultValue={job?.job_url ?? undefined}
              error={errors.job_url}
              label="Job URL"
              name="job_url"
              type="url"
            />
            <TextField
              defaultValue={job?.location ?? undefined}
              error={errors.location}
              label="Location"
              maxLength={200}
              name="location"
            />
          </div>
        </fieldset>

        <fieldset className="border-t border-line pt-7">
          <legend className="text-lg font-semibold text-ink">
            Work details
          </legend>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <SelectField
              defaultValue={job?.work_arrangement ?? "UNKNOWN"}
              error={errors.work_arrangement}
              label="Work arrangement"
              name="work_arrangement"
              options={[
                ["UNKNOWN", "Unknown"],
                ["REMOTE", "Remote"],
                ["HYBRID", "Hybrid"],
                ["ONSITE", "On-site"],
              ]}
            />
            <SelectField
              defaultValue={job?.employment_type ?? "UNKNOWN"}
              error={errors.employment_type}
              label="Employment type"
              name="employment_type"
              options={[
                ["UNKNOWN", "Unknown"],
                ["FULL_TIME", "Full-time"],
                ["PART_TIME", "Part-time"],
                ["CONTRACT", "Contract"],
                ["INTERNSHIP", "Internship"],
              ]}
            />
          </div>
        </fieldset>

        <div className="border-t border-line pt-7 text-sm font-medium text-ink">
          <label className="text-lg font-semibold" htmlFor="description">
            Description
          </label>
          <p className="mt-1 font-normal text-muted">
            Add the posting text to support deterministic skill detection.
          </p>
          <textarea
            aria-describedby={errorId("description", errors.description)}
            aria-invalid={Boolean(errors.description)}
            className="form-control mt-3 min-h-56"
            defaultValue={job?.description ?? undefined}
            maxLength={100_000}
            id="description"
            name="description"
          />
          <FieldError error={errors.description} name="description" />
        </div>
      </div>

      {state.formError ? (
        <p
          className="break-words rounded-lg bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {state.formError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <SaveButton
          label={job ? "Save changes" : "Add job"}
          pending={pending}
        />
        <Link
          className={buttonStyles({ variant: "secondary" })}
          href={cancelHref}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function TextField({
  defaultValue,
  error,
  label,
  maxLength,
  name,
  required,
  type = "text",
}: {
  defaultValue?: string;
  error?: string;
  label: string;
  maxLength?: number;
  name: JobField;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="block text-sm font-medium text-ink">
      <label htmlFor={name}>{label}</label>
      <input
        aria-describedby={errorId(name, error)}
        aria-invalid={Boolean(error)}
        className="form-control mt-1"
        defaultValue={defaultValue}
        id={name}
        maxLength={maxLength}
        name={name}
        required={required}
        type={type}
      />
      <FieldError error={error} name={name} />
    </div>
  );
}

function SelectField({
  defaultValue,
  error,
  label,
  name,
  options,
}: {
  defaultValue: string;
  error?: string;
  label: string;
  name: JobField;
  options: [string, string][];
}) {
  return (
    <div className="block text-sm font-medium text-ink">
      <label htmlFor={name}>{label}</label>
      <select
        aria-describedby={errorId(name, error)}
        aria-invalid={Boolean(error)}
        className="form-control mt-1"
        defaultValue={defaultValue}
        id={name}
        name={name}
      >
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
      <FieldError error={error} name={name} />
    </div>
  );
}

function FieldError({ error, name }: { error?: string; name: JobField }) {
  return error ? (
    <span className="mt-1 block break-words text-red-700" id={`${name}-error`}>
      {error}
    </span>
  ) : null;
}

function errorId(name: JobField, error?: string) {
  return error ? `${name}-error` : undefined;
}

function SaveButton({ label, pending }: { label: string; pending: boolean }) {
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Saving…" : label}
    </Button>
  );
}
