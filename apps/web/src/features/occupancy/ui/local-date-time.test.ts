import { afterEach, describe, expect, it } from "vitest";
import { fromLocalInputValue, toLocalInputValue } from "./local-date-time";

const originalTz = process.env.TZ;

afterEach(() => {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
});

const stockholm = "Europe/Stockholm";
const newYork = "America/New_York";

describe.each(["UTC", newYork, stockholm])("host time zone %s", (hostZone) => {
  it("reads a typed wall time in the given zone regardless of the host", () => {
    process.env.TZ = hostZone;
    // Winter (UTC+1) and summer (UTC+2).
    const winter = fromLocalInputValue({ value: "2026-01-15T09:00", timeZone: stockholm });
    expect(winter?.toISOString()).toBe("2026-01-15T08:00:00.000Z");
    const summer = fromLocalInputValue({ value: "2026-07-15T09:00", timeZone: stockholm });
    expect(summer?.toISOString()).toBe("2026-07-15T07:00:00.000Z");
    // The same wall time in another venue's zone is another instant (UTC-4 in summer).
    const away = fromLocalInputValue({ value: "2026-07-15T09:00", timeZone: newYork });
    expect(away?.toISOString()).toBe("2026-07-15T13:00:00.000Z");
  });

  it("round-trips through the input value, and a new zone shows the same instant differently", () => {
    process.env.TZ = hostZone;
    const date = new Date("2026-07-15T07:30:00.000Z");
    const value = toLocalInputValue({ date, timeZone: stockholm });
    expect(value).toBe("2026-07-15T09:30");
    expect(fromLocalInputValue({ value, timeZone: stockholm })).toEqual(date);
    expect(toLocalInputValue({ date, timeZone: newYork })).toBe("2026-07-15T03:30");
  });
});

describe("fromLocalInputValue", () => {
  it("returns undefined for empty or invalid values", () => {
    for (const value of ["", "  ", "not a date"]) {
      expect(fromLocalInputValue({ value, timeZone: stockholm })).toBeUndefined();
    }
  });
});
