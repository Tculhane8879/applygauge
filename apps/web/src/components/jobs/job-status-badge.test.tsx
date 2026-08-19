import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type ApplicationStatus } from "@/lib/api/jobs";

import { JobStatusBadge } from "./job-status-badge";

const statuses: ReadonlyArray<{
  label: string;
  status: ApplicationStatus;
  treatment: RegExp;
}> = [
  { status: "SAVED", label: "Saved", treatment: /stone/ },
  { status: "APPLIED", label: "Applied", treatment: /blue/ },
  { status: "SCREENING", label: "Screening", treatment: /violet/ },
  { status: "INTERVIEW", label: "Interview", treatment: /amber/ },
  { status: "OFFER", label: "Offer", treatment: /emerald/ },
  { status: "REJECTED", label: "Rejected", treatment: /red/ },
  { status: "WITHDRAWN", label: "Withdrawn", treatment: /gray/ },
];

describe("JobStatusBadge", () => {
  it.each(statuses)(
    "renders $status with its exact label and distinct treatment",
    ({ label, status, treatment }) => {
      render(<JobStatusBadge status={status} />);

      const badge = screen.getByText(label);
      expect(badge).toHaveAttribute("data-status", status);
      expect(badge.className).toMatch(treatment);
      expect(badge.className).not.toMatch(/rounded|border|bg-/);
    },
  );
});
