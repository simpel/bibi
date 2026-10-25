import { describe, expect, it } from "vitest";
import { exceptionRowsFrom, exceptionsFromRows } from "./hours-exceptions";

describe("dated exceptions in the hours editor (ADR 0064 rule 10a)", () => {
  const stored = [
    {
      date: "2026-12-24",
      startMinute: null,
      endMinute: null,
      breakStartMinute: null,
      breakEndMinute: null,
      note: "Christmas Eve",
    },
    {
      date: "2026-06-19",
      startMinute: 600,
      endMinute: 840,
      breakStartMinute: null,
      breakEndMinute: null,
      note: null,
    },
  ];

  it("round-trips exceptions, sorted by date", () => {
    const rows = exceptionRowsFrom({ exceptions: stored });
    expect(rows[0]?.closed).toBe(true);
    expect(exceptionsFromRows({ rows }).map((row) => row.date)).toEqual([
      "2026-06-19",
      "2026-12-24",
    ]);
    expect(exceptionsFromRows({ rows })[1]).toEqual(stored[0]);
  });

  it("drops times of a closed day and an empty note", () => {
    const rows = exceptionRowsFrom({ exceptions: stored }).map((row) => ({
      ...row,
      note: " ",
    }));
    expect(exceptionsFromRows({ rows })[1]).toMatchObject({
      startMinute: null,
      endMinute: null,
      note: null,
    });
  });
});
