import { describe, expect, it } from "vitest";
import { activePeriod, myWorkPeriods } from "./my-work-periods";

describe("myWorkPeriods", () => {
  it("links today to the start page and the others to their range", () => {
    const periods = myWorkPeriods({ today: "2026-11-14" });
    expect(periods.map((p) => p.href)).toEqual([
      "/",
      "/my-work/2026-11-15/2026-11-15",
      "/my-work/2026-11-14/2026-11-20",
    ]);
    expect(activePeriod({ periods, from: "2026-11-14", to: "2026-11-20" })).toBe("week");
    expect(activePeriod({ periods, from: "2026-11-16", to: "2026-11-16" })).toBeNull();
  });
});
