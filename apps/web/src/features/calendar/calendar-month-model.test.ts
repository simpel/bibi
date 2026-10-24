import { describe, expect, it } from "vitest";
import { monthWeeks } from "./calendar-month-model";
import { periodDays, periodFor } from "./calendar-period";

describe("calendar month model", () => {
  it("lays a month out in Monday-first weeks with blanks around it", () => {
    const dates = periodDays({
      period: periodFor({ view: "month", anchor: { year: 2026, month: 10, day: 15 } }),
    });
    const days = dates.map((date) => ({ key: `${date.day}`, label: "", entries: [] }));
    const weeks = monthWeeks({ dates, days });
    expect(weeks).toHaveLength(5);
    // 1 October 2026 is a Thursday.
    expect(weeks[0]?.slice(0, 3)).toEqual([0, 1, 2].map((i) => ({ blank: `before-${i}` })));
    expect(weeks[0]?.[3]).toMatchObject({ date: { day: 1 } });
    expect(weeks[4]?.[5]).toMatchObject({ date: { day: 31 } });
    expect(weeks[4]?.[6]).toEqual({ blank: "after-34" });
  });
});
