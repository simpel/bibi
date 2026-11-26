import { describe, expect, it } from "vitest";
import { minuteToTime, timeOrNull, timeToMinute } from "./clock";

describe("clock", () => {
  it("round-trips minutes", () => {
    expect(minuteToTime({ minute: 690 })).toBe("11:30");
    expect(timeToMinute({ time: "11:30" })).toBe(690);
  });
  it("keeps blank as null and garbage as NaN", () => {
    expect(timeOrNull({ time: "" })).toBeNull();
    expect(Number.isNaN(timeToMinute({ time: "late" }))).toBe(true);
  });
});
