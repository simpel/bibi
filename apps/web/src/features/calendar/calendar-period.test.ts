import { describe, expect, it } from "vitest";
import { anchorOf, readCalendarPeriod, shiftPeriod, todayPeriod, viewOf } from "./calendar-period";

const today = { year: 2026, month: 10, day: 15 };
const d = ({ month = 10, day }: { month?: number; day: number }) => ({ year: 2026, month, day });

describe("calendar period", () => {
  it("reads both dates, swaps a reversed range and turns invalid dates into today", () => {
    expect(readCalendarPeriod({ from: "2026-10-20", to: "2026-10-12", today })).toEqual({
      from: d({ day: 12 }),
      to: d({ day: 20 }),
    });
    expect(readCalendarPeriod({ from: "2026-02-31", to: "nope", today })).toEqual({
      from: today,
      to: today,
    });
  });

  it("cuts a period over 62 days", () => {
    const period = readCalendarPeriod({ from: "2026-01-01", to: "2026-12-31", today });
    expect(period).toEqual({ from: d({ month: 1, day: 1 }), to: d({ month: 3, day: 3 }) });
  });

  it("derives the view from the range", () => {
    expect(viewOf({ period: { from: today, to: today } })).toBe("day");
    expect(viewOf({ period: { from: d({ day: 9 }), to: d({ day: 15 }) } })).toBe("week");
    expect(viewOf({ period: { from: d({ day: 1 }), to: d({ day: 31 }) } })).toBe("month");
    expect(viewOf({ period: { from: d({ day: 1 }), to: d({ day: 30 }) } })).toBe("list");
  });

  it("steps a month by a month and anything else by its length", () => {
    const october = { from: d({ day: 1 }), to: d({ day: 31 }) };
    expect(shiftPeriod({ period: october, step: 1 })).toEqual({
      from: d({ month: 11, day: 1 }),
      to: d({ month: 11, day: 30 }),
    });
    const list = { from: d({ day: 1 }), to: d({ day: 10 }) };
    expect(shiftPeriod({ period: list, step: -1 })).toEqual({
      from: d({ month: 9, day: 21 }),
      to: d({ month: 9, day: 30 }),
    });
  });

  it("anchors on today when shown and keeps a list's length for today", () => {
    const week = { from: d({ day: 12 }), to: d({ day: 18 }) };
    expect(anchorOf({ period: week, today })).toEqual(today);
    expect(anchorOf({ period: week, today: d({ day: 30 }) })).toEqual(d({ day: 12 }));
    const list = { from: d({ day: 1 }), to: d({ day: 10 }) };
    expect(todayPeriod({ period: list, today })).toEqual({ from: today, to: d({ day: 24 }) });
  });
});
