import { describe, expect, it } from "vitest";
import { expandOccurrences } from "../src/index";
import { errorCode } from "./helpers";
import { expandRule, local, localDates } from "./recurrence-helpers";

describe("occurrence expansion (ADR 0023)", () => {
  it("S1: first Tuesday of the month, ten times, keeps 09:00 local", () => {
    const { occurrences, truncated } = expandRule({
      rrule: "FREQ=MONTHLY;BYDAY=1TU;COUNT=10",
      start: "2026-08-04T07:00:00Z",
      durationMinutes: 240,
    });
    expect(localDates({ occurrences })).toEqual([
      "2026-08-04",
      "2026-09-01",
      "2026-10-06",
      "2026-11-03",
      "2026-12-01",
      "2027-01-05",
      "2027-02-02",
      "2027-03-02",
      "2027-04-06",
      "2027-05-04",
    ]);
    expect(occurrences.map((occurrence) => occurrence.index)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    for (const occurrence of occurrences) {
      expect(local({ instant: occurrence.start }).slice(11)).toBe("09:00");
      expect(local({ instant: occurrence.end }).slice(11)).toBe("13:00");
    }
    expect(truncated).toBe(false);
  });

  it("S2: Thursdays, six times", () => {
    const { occurrences } = expandRule({
      rrule: "FREQ=WEEKLY;BYDAY=TH;COUNT=6",
      start: "2026-10-22T16:00:00Z",
    });
    expect(localDates({ occurrences })).toEqual([
      "2026-10-22",
      "2026-10-29",
      "2026-11-05",
      "2026-11-12",
      "2026-11-19",
      "2026-11-26",
    ]);
  });

  it("keeps the wall time across daylight saving changes", () => {
    const autumn = expandRule({ rrule: "FREQ=WEEKLY;COUNT=2", start: "2026-10-22T16:00:00Z" });
    expect(autumn.occurrences.map((occurrence) => occurrence.start.toISOString())).toEqual([
      "2026-10-22T16:00:00.000Z",
      "2026-10-29T17:00:00.000Z",
    ]);
    const spring = expandRule({ rrule: "FREQ=WEEKLY;COUNT=2", start: "2027-03-25T08:00:00Z" });
    expect(spring.occurrences.map((occurrence) => occurrence.start.toISOString())).toEqual([
      "2027-03-25T08:00:00.000Z",
      "2027-04-01T07:00:00.000Z",
    ]);
  });

  it("skips months without day 31", () => {
    const { occurrences } = expandRule({
      rrule: "FREQ=MONTHLY;COUNT=4",
      start: "2027-01-31T09:00:00Z",
    });
    expect(localDates({ occurrences })).toEqual([
      "2027-01-31",
      "2027-03-31",
      "2027-05-31",
      "2027-07-31",
    ]);
  });

  it("supports last weekday, several BYMONTHDAY values and INTERVAL", () => {
    const last = expandRule({
      rrule: "FREQ=MONTHLY;BYDAY=-1FR;COUNT=2",
      start: "2026-10-01T08:00:00Z",
    });
    expect(localDates(last)).toEqual(["2026-10-30", "2026-11-27"]);
    const days = expandRule({
      rrule: "FREQ=MONTHLY;BYMONTHDAY=15,1;COUNT=3",
      start: "2026-10-10T08:00:00Z",
    });
    expect(localDates(days)).toEqual(["2026-10-15", "2026-11-01", "2026-11-15"]);
    const fortnight = expandRule({
      rrule: "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=4",
      start: "2026-10-14T08:00:00Z",
    });
    expect(localDates(fortnight)).toEqual(["2026-10-14", "2026-10-26", "2026-10-28", "2026-11-09"]);
  });

  it("stops at COUNT or at UNTIL (inclusive), whichever the rule uses", () => {
    const counted = expandRule({ rrule: "FREQ=WEEKLY;COUNT=3", start: "2026-10-22T16:00:00Z" });
    expect(localDates(counted)).toEqual(["2026-10-22", "2026-10-29", "2026-11-05"]);
    const until = expandRule({
      rrule: "FREQ=WEEKLY;UNTIL=20261105",
      start: "2026-10-22T16:00:00Z",
    });
    expect(localDates(until)).toEqual(["2026-10-22", "2026-10-29", "2026-11-05"]);
    expect(until.truncated).toBe(false);
  });

  it("caps at 52 occurrences", () => {
    const weekly = expandRule({ rrule: "FREQ=WEEKLY;BYDAY=MO,TH", start: "2026-10-22T16:00:00Z" });
    expect(weekly.occurrences).toHaveLength(52);
    expect(weekly.truncated).toBe(true);
  });

  it("caps at 12 months ahead", () => {
    const monthly = expandRule({ rrule: "FREQ=MONTHLY;COUNT=40", start: "2026-10-22T16:00:00Z" });
    expect(localDates(monthly).at(-1)).toBe("2027-09-22");
    expect(monthly.occurrences).toHaveLength(12);
    expect(monthly.truncated).toBe(true);
    const ending = expandRule({
      rrule: "FREQ=MONTHLY;UNTIL=20270922",
      start: "2026-10-22T16:00:00Z",
    });
    expect(ending.truncated).toBe(false);
  });

  it("gives VALIDATION for an invalid time zone or duration", () => {
    const rule = { freq: "WEEKLY" as const };
    const start = new Date("2026-10-22T16:00:00Z");
    const zone = expandOccurrences({ rule, start, durationMinutes: 60, timeZone: "Mars/Olympus" });
    expect(errorCode({ result: zone })).toBe("VALIDATION");
    const duration = expandOccurrences({ rule, start, durationMinutes: 0 });
    expect(errorCode({ result: duration })).toBe("VALIDATION");
  });
});
