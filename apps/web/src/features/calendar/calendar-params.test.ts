import { describe, expect, it } from "vitest";
import {
  calendarHref,
  calendarRange,
  legacyPeriod,
  readCalendarFilters,
  readPreferredView,
} from "./calendar-params";

const TZ = "Europe/Stockholm";
const today = { year: 2026, month: 10, day: 15 };

describe("calendar params", () => {
  it("puts the period in the path and round-trips the filters in the query", () => {
    const raw = { venue: "v1", type: "t1", state: "s1", phase: "p1", ticket: "k1" };
    const params = { ...readCalendarFilters({ raw }), period: { from: today, to: today } };
    expect(calendarHref({ params })).toEqual({
      pathname: "/calendar/2026-10-15/2026-10-15",
      query: raw,
    });
  });

  it("redirects old ?view=&date= links to the same period", () => {
    expect(legacyPeriod({ raw: {}, today })).toBeUndefined();
    expect(legacyPeriod({ raw: { view: "week", date: "2026-10-14" }, today })).toEqual({
      from: { year: 2026, month: 10, day: 12 },
      to: { year: 2026, month: 10, day: 18 },
    });
    expect(legacyPeriod({ raw: { date: "2026-02-31" }, today })).toEqual({
      from: today,
      to: today,
    });
  });

  it("falls back to the day view for an unknown preference", () => {
    expect(readPreferredView({ value: "month" })).toBe("month");
    expect(readPreferredView({ value: 3 })).toBe("day");
  });

  it("covers the local days as instants, across the DST change", () => {
    const day = { year: 2026, month: 10, day: 25 };
    const { from, to } = calendarRange({ period: { from: day, to: day }, timeZone: TZ });
    expect(from.toISOString()).toBe("2026-10-24T22:00:00.000Z");
    expect(to.toISOString()).toBe("2026-10-25T23:00:00.000Z");
  });
});
