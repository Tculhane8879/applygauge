import { describe, expect, it } from "vitest";

import { type ApplicationStatus, type SkillSource } from "@/lib/api/jobs";

import {
  applicationStatusLabel,
  formatJobDateTime,
  getSkillSourceLabel,
} from "./presentation";

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

describe("skill source presentation", () => {
  it.each<[SkillSource[], string]>([
    [["MANUAL"], "Manual"],
    [["DETECTED"], "Detected"],
    [["MANUAL", "DETECTED"], "Manual + detected"],
  ])("maps %j to %s", (sources, expected) => {
    expect(getSkillSourceLabel(sources)).toBe(expected);
  });

  it("does not mislabel an impossible backend combination", () => {
    expect(getSkillSourceLabel([])).toBe("Unknown source");
    expect(getSkillSourceLabel(["DETECTED", "MANUAL"])).toBe("Unknown source");
  });
});
