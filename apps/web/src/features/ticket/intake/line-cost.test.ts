import { describe, expect, it } from "vitest";
import { lineCostMinor, linesTotalMinor } from "./line-cost";

const priced = ({
  quantity = 10,
  price = 6500 as number | null,
  discount = 0,
}: {
  quantity?: number | null;
  price?: number | null;
  discount?: number;
}) => ({
  effectiveQuantity: quantity,
  effectiveUnitPriceMinor: price,
  effectiveDiscountPercent: discount,
});

describe("line cost", () => {
  it("is quantity times unit price less the discount", () => {
    expect(lineCostMinor({ planned: priced({ quantity: 20, discount: 10 }) })).toBe(117_000);
  });

  it("rounds to whole minor units", () => {
    expect(lineCostMinor({ planned: priced({ quantity: 3, price: 333, discount: 5 }) })).toBe(949);
  });

  it("has no cost without a price or a preview", () => {
    expect(lineCostMinor({ planned: priced({ price: null }) })).toBeNull();
    expect(lineCostMinor({ planned: null })).toBeNull();
  });

  it("totals the priced lines only", () => {
    const planned = [priced({}), priced({ price: null }), priced({ quantity: 1, price: 70_000 })];
    expect(linesTotalMinor({ planned })).toBe(135_000);
    expect(linesTotalMinor({ planned: [priced({ price: null })] })).toBeNull();
    expect(linesTotalMinor({ planned: null })).toBeNull();
  });
});
