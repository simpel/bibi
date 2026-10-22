import { DEFAULT_WORKING_HOURS } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { daysFromRows, groupRows, rowsFromDays, toMinute, toTime } from "./hours";

describe("working hours in the welcome flow (ADR 0061)", () => {
  it("converts between minutes and HH:MM", () => {
    expect(toTime({ minute: 480 })).toBe("08:00");
    expect(toMinute({ time: "17:30" })).toBe(1050);
    expect(toMinute({ time: "" })).toBeNull();
  });

  it("round-trips the default week", () => {
    const rows = rowsFromDays({ days: DEFAULT_WORKING_HOURS });
    expect(rows.filter((row) => row.works).map((row) => row.weekday)).toEqual([0, 1, 2, 3, 4]);
    expect(daysFromRows({ rows })).toEqual(DEFAULT_WORKING_HOURS);
  });

  it("groups Monday–Friday and the weekend for the summary", () => {
    const groups = groupRows({ rows: rowsFromDays({ days: DEFAULT_WORKING_HOURS }) });
    expect(groups.map(({ from, to, row }) => [from, to, row.works])).toEqual([
      [0, 4, true],
      [5, 6, false],
    ]);
  });

  it("drops the break when it is cleared", () => {
    const rows = rowsFromDays({ days: DEFAULT_WORKING_HOURS }).map((row) => ({
      ...row,
      breakStart: "",
      breakEnd: "",
    }));
    expect(daysFromRows({ rows })[0]).toMatchObject({
      breakStartMinute: null,
      breakEndMinute: null,
    });
  });
});
