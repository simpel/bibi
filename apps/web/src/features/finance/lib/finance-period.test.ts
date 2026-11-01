import { describe, expect, it } from "vitest";
import {
  isValidPeriod,
  lastMonthsPeriod,
  periodMonths,
  shiftPeriod,
  yearPeriod,
} from "./finance-period";

const today = { year: 2026, month: 3, day: 14 };

describe("finance period", () => {
  it("covers the last 12 whole months ending with the current month", () => {
    expect(lastMonthsPeriod({ today, months: 12 })).toEqual({
      from: "2025-04-01",
      to: "2026-03-31",
    });
  });

  it("covers the calendar year", () => {
    expect(yearPeriod({ today })).toEqual({ from: "2026-01-01", to: "2026-12-31" });
  });

  it("counts the months a period touches", () => {
    expect(periodMonths({ from: "2025-04-01", to: "2026-03-31" })).toBe(12);
    expect(periodMonths({ from: "2026-01-20", to: "2026-01-25" })).toBe(1);
  });

  it("shifts by its own length, to whole months", () => {
    const period = { from: "2025-04-01", to: "2026-03-31" };
    expect(shiftPeriod({ period, direction: -1 })).toEqual({
      from: "2024-04-01",
      to: "2025-03-31",
    });
    expect(shiftPeriod({ period, direction: 1 })).toEqual({ from: "2026-04-01", to: "2027-03-31" });
  });

  it("accepts only ordered valid days within 24 months", () => {
    expect(isValidPeriod({ from: "2026-01-01", to: "2026-12-31" })).toBe(true);
    expect(isValidPeriod({ from: "2026-02-01", to: "2026-01-01" })).toBe(false);
    expect(isValidPeriod({ from: "2026-02-30", to: "2026-03-01" })).toBe(false);
    expect(isValidPeriod({ from: "2024-01-01", to: "2026-01-31" })).toBe(false);
  });
});
