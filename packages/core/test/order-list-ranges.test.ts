import { describe, expect, it } from "vitest";
import { dateRange, numberRange } from "../src/features/order/list-ranges";

describe("numberRange", () => {
  it("reads exact values, comparisons and ranges with inclusive bounds", () => {
    expect(numberRange({ raw: "50" })).toEqual({ min: 50, max: 50 });
    expect(numberRange({ raw: ">50" })).toEqual({ min: 51 });
    expect(numberRange({ raw: ">=50" })).toEqual({ min: 50 });
    expect(numberRange({ raw: "<10" })).toEqual({ max: 9 });
    expect(numberRange({ raw: "<=10" })).toEqual({ max: 10 });
    expect(numberRange({ raw: "10..20" })).toEqual({ min: 10, max: 20 });
    expect(numberRange({ raw: "10..*" })).toEqual({ min: 10 });
  });

  it("refuses what it cannot read", () => {
    expect(numberRange({ raw: "many" })).toBeNull();
    expect(numberRange({ raw: "1..2..3" })).toBeNull();
    expect(numberRange({ raw: ">" })).toBeNull();
  });
});

describe("dateRange", () => {
  it("covers a whole day, month or year", () => {
    expect(dateRange({ raw: "2026-12-24" })).toEqual({
      from: { year: 2026, month: 12, day: 24 },
      until: { year: 2026, month: 12, day: 25 },
    });
    expect(dateRange({ raw: "2026-12" })).toEqual({
      from: { year: 2026, month: 12, day: 1 },
      until: { year: 2027, month: 1, day: 1 },
    });
    expect(dateRange({ raw: "2026" })).toEqual({
      from: { year: 2026, month: 1, day: 1 },
      until: { year: 2027, month: 1, day: 1 },
    });
  });

  it("reads comparisons and ranges", () => {
    expect(dateRange({ raw: ">2026-12-01" })).toEqual({ from: { year: 2026, month: 12, day: 2 } });
    expect(dateRange({ raw: "<=2026-11" })).toEqual({ until: { year: 2026, month: 12, day: 1 } });
    expect(dateRange({ raw: "2026-11-01..2026-11-30" })).toEqual({
      from: { year: 2026, month: 11, day: 1 },
      until: { year: 2026, month: 12, day: 1 },
    });
    expect(dateRange({ raw: "*..2026-01-31" })).toEqual({
      until: { year: 2026, month: 2, day: 1 },
    });
  });

  it("refuses invalid dates", () => {
    expect(dateRange({ raw: "2026-13" })).toBeNull();
    expect(dateRange({ raw: "tomorrow" })).toBeNull();
  });
});
