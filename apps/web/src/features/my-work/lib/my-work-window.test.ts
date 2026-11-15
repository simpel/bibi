import { describe, expect, it } from "vitest";
import { sectionOf, startWindow } from "./my-work-window";

// Wednesday 18 November 2026.
const today = "2026-11-18";

describe("my work sections (spec: home)", () => {
  it("reads from today to the end of next week", () => {
    expect(startWindow({ today })).toEqual({ from: today, to: "2026-11-29" });
    expect(startWindow({ today: "2026-11-15" })).toEqual({ from: "2026-11-15", to: "2026-11-22" });
  });

  it("puts each day in today, this week, next week or later", () => {
    expect(sectionOf({ day: today, today })).toBe("today");
    expect(sectionOf({ day: "2026-11-22", today })).toBe("thisWeek");
    expect(sectionOf({ day: "2026-11-23", today })).toBe("nextWeek");
    expect(sectionOf({ day: "2026-11-29", today })).toBe("nextWeek");
    expect(sectionOf({ day: "2026-11-30", today })).toBe("later");
  });
});
