import { describe, expect, it } from "vitest";
import { dayOf, endOfDay, startOfDay } from "./edge-time";

describe("edge time", () => {
  it("puts the end of a Stockholm day at 23:59:59 local time", () => {
    const end = endOfDay({ day: "2026-12-22", timeZone: "Europe/Stockholm" });
    expect(end.toISOString()).toBe("2026-12-22T22:59:59.000Z");
    expect(dayOf({ instant: end, timeZone: "Europe/Stockholm" })).toBe("2026-12-22");
  });

  it("starts a day at local midnight, in summer time too", () => {
    const start = startOfDay({ day: "2026-07-01", timeZone: "Europe/Stockholm" });
    expect(start.toISOString()).toBe("2026-06-30T22:00:00.000Z");
  });

  it("has no day for no instant", () => {
    expect(dayOf({ instant: null, timeZone: "Europe/Stockholm" })).toBe("");
  });
});
