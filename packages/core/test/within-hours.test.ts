import { describe, expect, it } from "vitest";
import type { OpenSpan } from "../src/hours/day-schema";
import { type HoursLookup, withinHours } from "../src/hours/within-hours";

const ZONE = "Europe/Stockholm";
const OFFICE: OpenSpan = {
  startMinute: 480,
  endMinute: 1020,
  breakStartMinute: 720,
  breakEndMinute: 780,
};

const weekdays = new Map([0, 1, 2, 3, 4].map((weekday) => [weekday, OFFICE]));
const lookup = ({
  exceptions = [],
}: {
  exceptions?: [string, OpenSpan | null][];
} = {}): HoursLookup => ({
  days: weekdays,
  exceptions: new Map(exceptions),
});

const check = ({ hours = lookup(), from, to }: { hours?: HoursLookup; from: string; to: string }) =>
  withinHours({ hours, timeZone: ZONE, startsAt: new Date(from), endsAt: new Date(to) });

describe("withinHours (ADR 0064 rule 11)", () => {
  it("accepts a span inside open hours and rejects the break, the evening and a closed weekday", () => {
    // Monday 2 November 2026; Stockholm is UTC+1.
    expect(check({ from: "2026-11-02T08:00:00Z", to: "2026-11-02T10:00:00Z" })).toBe(true);
    expect(check({ from: "2026-11-02T10:30:00Z", to: "2026-11-02T11:30:00Z" })).toBe(false);
    expect(check({ from: "2026-11-02T15:00:00Z", to: "2026-11-02T17:00:00Z" })).toBe(false);
    expect(check({ from: "2026-11-07T08:00:00Z", to: "2026-11-07T09:00:00Z" })).toBe(false);
  });

  it("reads minutes in the zone across a daylight saving change", () => {
    // Monday 30 March 2026, the day after summer time starts: UTC+2, so 08:00 local is 06:00Z.
    expect(check({ from: "2026-03-30T06:00:00Z", to: "2026-03-30T07:00:00Z" })).toBe(true);
    expect(check({ from: "2026-03-30T05:30:00Z", to: "2026-03-30T07:00:00Z" })).toBe(false);
  });

  it("lets an exception close a day or give it other hours", () => {
    const closed = lookup({ exceptions: [["2026-11-02", null]] });
    expect(check({ hours: closed, from: "2026-11-02T08:00:00Z", to: "2026-11-02T09:00:00Z" })).toBe(
      false,
    );
    const late: OpenSpan = {
      startMinute: 1080,
      endMinute: 1440,
      breakStartMinute: null,
      breakEndMinute: null,
    };
    // Saturday 7 November is closed by the weekly pattern but open 18–24 by exception.
    const open = lookup({ exceptions: [["2026-11-07", late]] });
    expect(check({ hours: open, from: "2026-11-07T18:00:00Z", to: "2026-11-07T22:00:00Z" })).toBe(
      true,
    );
  });

  it("needs both days open for a span past midnight", () => {
    const allDay: OpenSpan = {
      startMinute: 0,
      endMinute: 1440,
      breakStartMinute: null,
      breakEndMinute: null,
    };
    const hours: HoursLookup = {
      days: new Map([
        [0, allDay],
        [1, allDay],
      ]),
      exceptions: new Map(),
    };
    expect(check({ hours, from: "2026-11-02T20:00:00Z", to: "2026-11-03T03:00:00Z" })).toBe(true);
    const monday: HoursLookup = { days: new Map([[0, allDay]]), exceptions: new Map() };
    expect(check({ hours: monday, from: "2026-11-02T20:00:00Z", to: "2026-11-03T03:00:00Z" })).toBe(
      false,
    );
  });
});
