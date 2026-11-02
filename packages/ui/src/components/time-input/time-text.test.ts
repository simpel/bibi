import { describe, expect, it } from "vitest";
import { minutesToTime, parseTimeText, stepTime } from "./time-text";

describe("parseTimeText", () => {
  it("reads the usual ways to type a time", () => {
    expect(parseTimeText({ text: "9" })).toBe("09:00");
    expect(parseTimeText({ text: "930" })).toBe("09:30");
    expect(parseTimeText({ text: "0930" })).toBe("09:30");
    expect(parseTimeText({ text: "9:30" })).toBe("09:30");
    expect(parseTimeText({ text: "17.05" })).toBe("17:05");
  });

  it("refuses what is not a time of day", () => {
    expect(parseTimeText({ text: "" })).toBeNull();
    expect(parseTimeText({ text: "24:00" })).toBeNull();
    expect(parseTimeText({ text: "12:60" })).toBeNull();
    expect(parseTimeText({ text: "noon" })).toBeNull();
  });
});

describe("stepTime", () => {
  it("moves by the step and snaps to it", () => {
    expect(stepTime({ value: "09:00", minutes: 15 })).toBe("09:15");
    expect(stepTime({ value: "09:07", minutes: 15 })).toBe("09:15");
    expect(stepTime({ value: "09:07", minutes: -15 })).toBe("09:00");
    expect(stepTime({ value: "23:50", minutes: 15 })).toBe("00:00");
  });

  it("starts an empty field at 08:00", () => {
    expect(stepTime({ value: "", minutes: 15 })).toBe("08:00");
  });
});

describe("minutesToTime", () => {
  it("wraps into one day", () => {
    expect(minutesToTime({ minutes: -15 })).toBe("23:45");
    expect(minutesToTime({ minutes: 1440 + 61 })).toBe("01:01");
  });
});
