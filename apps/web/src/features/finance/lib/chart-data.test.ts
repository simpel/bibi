import type { FinanceAging, FinanceMonth } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { agingWithMoney, monthsWithMoney } from "./chart-data";

const month = ({ minor }: { minor: number }): FinanceMonth => ({
  month: "2026-11",
  invoicedExclVatMinor: minor,
  receivedMinor: 0,
});

const aging = ({ notDueMinor }: { notDueMinor: number }): FinanceAging => ({
  notDueMinor,
  overdue1to30Minor: 0,
  overdue31to60Minor: 0,
  overdue61PlusMinor: 0,
  overdue: [],
});

describe("monthsWithMoney", () => {
  it("drops months that are all zero", () => {
    expect(monthsWithMoney({ monthly: [month({ minor: 0 }), month({ minor: 0 })] })).toEqual([]);
  });

  it("keeps every month once one has money", () => {
    expect(monthsWithMoney({ monthly: [month({ minor: 0 }), month({ minor: 500 })] })).toHaveLength(2);
  });

  it("passes no access through", () => {
    expect(monthsWithMoney({ monthly: null })).toBeNull();
  });
});

describe("agingWithMoney", () => {
  it("drops the buckets when nothing is open", () => {
    expect(agingWithMoney({ aging: aging({ notDueMinor: 0 }) })).toEqual([]);
  });

  it("keeps the buckets when something is open", () => {
    expect(agingWithMoney({ aging: aging({ notDueMinor: 100 }) })).toHaveLength(1);
  });

  it("passes no access through", () => {
    expect(agingWithMoney({ aging: null })).toBeNull();
  });
});
