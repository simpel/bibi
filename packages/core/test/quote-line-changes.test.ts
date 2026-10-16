import { describe, expect, it } from "vitest";
import { markLineChanges } from "../src/features/quote/line-changes";
import { lineAmounts, quoteTotals } from "../src/features/quote/line-totals";
import type { OrderLineDto } from "../src/index";

const line = ({ overrides = {} }: { overrides?: Partial<OrderLineDto> } = {}): OrderLineDto => ({
  id: "l",
  itemId: "lunch",
  position: 0,
  name: "Lunch",
  quantity: 20,
  unitPriceMinor: 25_000,
  priceUnit: "PER_PERSON",
  discountPercent: 0,
  vatRatePercent: 12,
  tags: [],
  totalExclVatMinor: 500_000,
  vatMinor: 60_000,
  ...overrides,
});

describe("order line amounts", () => {
  it("applies the discount, then VAT, rounded to whole minor units", () => {
    const input = { quantity: 3, unitPriceMinor: 3_333, discountPercent: 10, vatRatePercent: 12 };
    expect(lineAmounts(input)).toEqual({ totalExclVatMinor: 8_999, vatMinor: 1_080 });
  });

  it("sums the lines into the quote totals", () => {
    const lines = [
      { totalExclVatMinor: 500_000, vatMinor: 60_000 },
      { totalExclVatMinor: 80_000, vatMinor: 20_000 },
    ];
    expect(quoteTotals({ lines })).toEqual({
      totalExclVatMinor: 580_000,
      totalInclVatMinor: 660_000,
    });
  });
});

describe("change markers against the previous version (ADR 0022)", () => {
  it("leaves version 1 unmarked", () => {
    const marked = markLineChanges({ lines: [line()], previous: null });
    expect(marked.lines[0]).toMatchObject({ change: null, changedFields: [] });
    expect(marked.removedLines).toEqual([]);
  });

  it("marks added, changed and unchanged lines and lists removed ones", () => {
    const previous = [
      line({ overrides: { id: "a" } }),
      line({ overrides: { id: "b", itemId: "coffee", name: "Coffee" } }),
      line({ overrides: { id: "c", itemId: "room", name: "Room" } }),
    ];
    const lines = [
      line({ overrides: { id: "a2" } }),
      line({
        overrides: { id: "b2", itemId: "coffee", name: "Coffee", quantity: 25, discountPercent: 5 },
      }),
      line({ overrides: { id: "d2", itemId: "cake", name: "Cake" } }),
    ];
    const marked = markLineChanges({ lines, previous });
    expect(marked.lines.map((l) => [l.change, l.changedFields])).toEqual([
      ["UNCHANGED", []],
      ["CHANGED", ["quantity", "discountPercent"]],
      ["ADDED", []],
    ]);
    expect(marked.removedLines.map((l) => l.id)).toEqual(["c"]);
  });

  it("pairs repeated items in order", () => {
    const previous = [
      line({ overrides: { id: "a", quantity: 1 } }),
      line({ overrides: { id: "b", quantity: 2 } }),
    ];
    const lines = [
      line({ overrides: { quantity: 1 } }),
      line({ overrides: { quantity: 3 } }),
      line({ overrides: { quantity: 4 } }),
    ];
    const marked = markLineChanges({ lines, previous });
    expect(marked.lines.map((l) => l.change)).toEqual(["UNCHANGED", "CHANGED", "ADDED"]);
  });
});
