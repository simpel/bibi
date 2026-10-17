import { describe, expect, it } from "vitest";
import {
  calendarDays,
  calendarQuery,
  calendarRange,
  readCalendarParams,
  shiftCalendar,
} from "./calendar-params";

const TZ = "Europe/Stockholm";
const now = new Date("2026-10-14T22:30:00Z"); // Thursday 15 Oct, 00:30 in Stockholm

describe("calendar params", () => {
  it("defaults to today's day view in the time zone and ignores invalid dates", () => {
    expect(readCalendarParams({ raw: {}, now, timeZone: TZ })).toEqual({
      view: "day",
      date: { year: 2026, month: 10, day: 15 },
      venueId: undefined,
    });
    const invalid = readCalendarParams({ raw: { date: "2026-02-31" }, now, timeZone: TZ });
    expect(invalid.date).toEqual({ year: 2026, month: 10, day: 15 });
  });

  it("round-trips the query", () => {
    const raw = { view: "week", date: "2026-10-14", venue: "v1" };
    const params = readCalendarParams({ raw, now, timeZone: TZ });
    expect(calendarQuery({ params })).toEqual(raw);
  });

  it("shows Monday to Sunday in the week view and shifts by a week", () => {
    const params = readCalendarParams({
      raw: { view: "week", date: "2026-10-14" },
      now,
      timeZone: TZ,
    });
    const days = calendarDays({ params });
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual({ year: 2026, month: 10, day: 12 });
    expect(days[6]).toEqual({ year: 2026, month: 10, day: 18 });
    expect(shiftCalendar({ params, step: 1 }).date).toEqual({ year: 2026, month: 10, day: 21 });
  });

  it("covers the local day as instants, across the DST change", () => {
    const params = readCalendarParams({ raw: { date: "2026-10-25" }, now, timeZone: TZ });
    const { from, to } = calendarRange({ params, timeZone: TZ });
    expect(from.toISOString()).toBe("2026-10-24T22:00:00.000Z");
    expect(to.toISOString()).toBe("2026-10-25T23:00:00.000Z");
  });
});
