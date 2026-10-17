import { afterEach, describe, expect, it } from "vitest";
import { fromLocalInputValue, toLocalInputValue } from "./local-date-time";

const originalTz = process.env.TZ;

afterEach(() => {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
});

describe.each(["UTC", "America/New_York", "Europe/Stockholm"])("host time zone %s", (hostZone) => {
  it("reads a typed wall time as Stockholm time regardless of the host", () => {
    process.env.TZ = hostZone;
    // Winter (UTC+1) and summer (UTC+2).
    expect(fromLocalInputValue({ value: "2026-01-15T09:00" })?.toISOString()).toBe(
      "2026-01-15T08:00:00.000Z",
    );
    expect(fromLocalInputValue({ value: "2026-07-15T09:00" })?.toISOString()).toBe(
      "2026-07-15T07:00:00.000Z",
    );
  });

  it("round-trips through the input value", () => {
    process.env.TZ = hostZone;
    const date = new Date("2026-07-15T07:30:00.000Z");
    expect(toLocalInputValue({ date })).toBe("2026-07-15T09:30");
    expect(fromLocalInputValue({ value: toLocalInputValue({ date }) })).toEqual(date);
  });
});

describe("fromLocalInputValue", () => {
  it("returns undefined for empty or invalid values", () => {
    expect(fromLocalInputValue({ value: "" })).toBeUndefined();
    expect(fromLocalInputValue({ value: "  " })).toBeUndefined();
    expect(fromLocalInputValue({ value: "not a date" })).toBeUndefined();
  });
});
