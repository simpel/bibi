import { describe, expect, it } from "vitest";
import { todayWindow } from "./today-window";

describe("todayWindow", () => {
  it("spans the zone's day, whatever the instant's UTC date", () => {
    const now = new Date("2026-11-03T23:30:00Z"); // 00:30 on the 4th in Stockholm
    expect(todayWindow({ now, timeZone: "Europe/Stockholm" })).toEqual({
      from: new Date("2026-11-03T23:00:00Z"),
      to: new Date("2026-11-04T23:00:00Z"),
    });
  });

  it("is 23 hours on the day summer time starts", () => {
    const { from, to } = todayWindow({
      now: new Date("2026-03-29T10:00:00Z"),
      timeZone: "Europe/Stockholm",
    });
    expect(to.getTime() - from.getTime()).toBe(23 * 3_600_000);
  });
});
