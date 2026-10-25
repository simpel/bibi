import { describe, expect, it } from "vitest";
import { createDateTimeFormat, type DisplayFormats } from "../src/schemas";

const AFTERNOON = new Date("2026-08-27T12:30:00Z"); // 14:30 in Stockholm (CEST)
const EVENING = new Date("2026-08-27T14:05:00Z");
const NEXT_DAY = new Date("2026-08-28T07:00:00Z");
const DEFAULTS: DisplayFormats = { dateFormat: null, clockFormat: null };

type MakeInput = { locale?: string; formats?: DisplayFormats };

const make = ({ locale = "en", formats = DEFAULTS }: MakeInput = {}) =>
  createDateTimeFormat({ locale, timeZone: "Europe/Stockholm", formats });

describe("createDateTimeFormat (#481)", () => {
  it("defaults to 27 Aug 2026 and a 24 hour clock in every locale", () => {
    expect(make().date({ instant: AFTERNOON })).toBe("27 Aug 2026");
    expect(make().time({ instant: AFTERNOON })).toBe("14:30");
    expect(make().dateTime({ instant: AFTERNOON })).toBe("27 Aug 2026, 14:30");
    expect(make({ locale: "sv" }).date({ instant: AFTERNOON })).toMatch(/^27 aug\.? 2026$/);
  });

  it("writes each date pattern", () => {
    const date = ({ dateFormat }: { dateFormat: DisplayFormats["dateFormat"] }) =>
      make({ formats: { dateFormat, clockFormat: null } }).date({ instant: AFTERNOON });
    expect(date({ dateFormat: "D_MMMM_YYYY" })).toBe("27 August 2026");
    expect(date({ dateFormat: "YYYY_MM_DD" })).toBe("2026-08-27");
    expect(date({ dateFormat: "DD_MM_YYYY" })).toBe("27/08/2026");
    expect(date({ dateFormat: "MM_DD_YYYY" })).toBe("08/27/2026");
  });

  it("uses a 12 hour clock and numeric dates without a comma", () => {
    const format = make({ formats: { dateFormat: "YYYY_MM_DD", clockFormat: "H12" } });
    expect(format.dateTime({ instant: AFTERNOON })).toMatch(/^2026-08-27 2:30\sPM$/);
  });

  it("renders in the zone a call passes, else the default one", () => {
    expect(make().time({ instant: AFTERNOON, timeZone: "UTC" })).toBe("12:30");
  });

  it("shows seconds and the weekday alone when asked", () => {
    expect(make().time({ instant: AFTERNOON, seconds: true })).toBe("14:30:00");
    expect(make().weekday({ instant: AFTERNOON, style: "short" })).toBe("Thu");
  });

  it("drops the year and adds the weekday when asked", () => {
    expect(make().date({ instant: AFTERNOON, year: false, weekday: "short" })).toBe("Thu 27 Aug");
  });

  it("collapses a range within one day and keeps both ends otherwise", () => {
    expect(make().dateTimeRange({ start: AFTERNOON, end: EVENING })).toBe(
      "27 Aug 2026, 14:30 – 16:05",
    );
    expect(make().dateRange({ start: AFTERNOON, end: EVENING })).toBe("27 Aug 2026");
    expect(make().dateTimeRange({ start: AFTERNOON, end: NEXT_DAY })).toBe(
      "27 Aug 2026, 14:30 – 28 Aug 2026, 09:00",
    );
    expect(make().timeRange({ start: AFTERNOON, end: "2026-08-27T14:05:00.000Z" })).toBe(
      "14:30 – 16:05",
    );
  });
});
