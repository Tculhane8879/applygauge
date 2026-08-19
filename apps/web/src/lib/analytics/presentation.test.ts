import { describe, expect, it } from "vitest";

import { formatAnalyticsPercentage, formatJobCount } from "./presentation";

describe("analytics presentation", () => {
  it("formats job grammar without changing the supplied count", () => {
    expect(formatJobCount(1)).toBe("1 job");
    expect(formatJobCount(2)).toBe("2 jobs");
  });

  it("formats the backend percentage with one visible decimal", () => {
    expect(formatAnalyticsPercentage(75)).toBe("75.0%");
    expect(formatAnalyticsPercentage(16.7)).toBe("16.7%");
  });
});
