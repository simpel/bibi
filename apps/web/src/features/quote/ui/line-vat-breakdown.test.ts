import { describe, expect, it } from "vitest";
import { lineVatBreakdown } from "./line-vat-breakdown";

describe("lineVatBreakdown", () => {
  it("returns one row per rate that sum to the bundle total", () => {
    const vatRows = [
      { vatRatePercent: 12, totalExclVatMinor: 40_000, vatMinor: 4_800 },
      { vatRatePercent: 25, totalExclVatMinor: 60_000, vatMinor: 15_000 },
    ];
    const result = lineVatBreakdown({ line: { vatRows } });
    expect(result?.rows).toHaveLength(2);
    expect(result?.baseMinor).toBe(100_000);
    expect(result?.vatMinor).toBe(19_800);
  });

  it("returns null for a line with a single rate", () => {
    const vatRows = [{ vatRatePercent: 25, totalExclVatMinor: 100_000, vatMinor: 25_000 }];
    expect(lineVatBreakdown({ line: { vatRows } })).toBeNull();
  });
});
