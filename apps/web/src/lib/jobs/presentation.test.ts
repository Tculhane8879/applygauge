import { describe, expect, it } from "vitest";

import { type ApplicationStatus } from "@/lib/api/jobs";

import { applicationStatusLabel, formatJobDateTime } from "./presentation";

describe("job status presentation", () => {
  it.each<[ApplicationStatus, string]>([
    ["SAVED", "Saved"],
    ["APPLIED", "Applied"],
    ["SCREENING", "Screening"],
    ["INTERVIEW", "Interview"],
    ["OFFER", "Offer"],
    ["REJECTED", "Rejected"],
    ["WITHDRAWN", "Withdrawn"],
  ])("maps %s to %s", (status, expected) => {
    expect(applicationStatusLabel(status)).toBe(expected);
  });

  it("formats transition timestamps deterministically in UTC", () => {
    expect(formatJobDateTime("2026-08-17T18:42:00Z")).toBe(
      "Aug 17, 2026, 6:42 PM UTC",
    );
  });
});
