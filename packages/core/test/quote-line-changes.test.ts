import { describe, expect, it } from "vitest";
import { markLineChanges } from "../src/features/quote/line-changes";
import { lineAmounts, quoteTotals } from "../src/features/quote/line-totals";
import type { OrderLineDto } from "../src/index";

const line = ({ overrides = {} }: { overrides?: Partial<OrderLineDto> } = {}): OrderLineDto => ({
  id: "l",
  lineId: "l",
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
  alternativeGroupId: null,
  alternativeGroupName: null,
  alternativeGroupChosen: null,
  inTotal: true,
  ...overrides,
});

describe("order line amounts", () => {
  it("applies the discount, then VAT, rounded to whole minor units", () => {
    const input = { quantity: 3, unitPriceMinor: 3_333, discountPercent: 10, vatRatePercent: 12 };
    expect(lineAmounts(input)).toEqual({ totalExclVatMinor: 8_999, vatMinor: 1_080 });
  });

  it("sums the lines into the quote totals", () => {
    const lines = [
      { totalExclVatMinor: 500_000, vatMinor: 60_000, inTotal: true },
      { totalExclVatMinor: 80_000, vatMinor: 20_000, inTotal: true },
      { totalExclVatMinor: 90_000, vatMinor: 22_500, inTotal: false },
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

  it("pairs lines by lineId: added, changed, unchanged and removed", () => {
    const previous = [
      line({ overrides: { id: "a", lineId: "x" } }),
      line({ overrides: { id: "b", lineId: "y", itemId: "coffee", name: "Coffee" } }),
      line({ overrides: { id: "c", lineId: "z", itemId: "room", name: "Room" } }),
    ];
    const lines = [
      line({ overrides: { id: "a2", lineId: "x" } }),
      line({
        overrides: { id: "b2", lineId: "y", itemId: "coffee", name: "Coffee", quantity: 25 },
      }),
      line({ overrides: { id: "d2", lineId: "w", itemId: "cake", name: "Cake" } }),
    ];
    const marked = markLineChanges({ lines, previous });
    expect(marked.lines.map((l) => [l.change, l.changedFields])).toEqual([
      ["UNCHANGED", []],
      ["CHANGED", ["quantity"]],
      ["ADDED", []],
    ]);
    expect(marked.removedLines.map((l) => l.id)).toEqual(["c"]);
  });

  it("never pairs two lines of the same item that are different lines", () => {
    const previous = [line({ overrides: { id: "a", lineId: "x" } })];
    const lines = [
      line({ overrides: { lineId: "y" } }),
      line({ overrides: { lineId: "x", discountPercent: 5 } }),
    ];
    const marked = markLineChanges({ lines, previous });
    expect(marked.lines.map((l) => l.change)).toEqual(["ADDED", "CHANGED"]);
  });
});
