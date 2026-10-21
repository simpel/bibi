import { describe, expect, it } from "vitest";
import { allocateBundleVat, allocateShares } from "../src/features/quote/bundle-vat";

describe("allocating a bundle price across its parts (ADR 0059)", () => {
  it("splits by weight with largest-remainder rounding so the shares sum exactly", () => {
    const parts = [1, 1, 1].map(() => ({ weightMinor: 10, vatRatePercent: 12 }));
    expect(allocateShares({ totalExclVatMinor: 100, parts })).toEqual([34, 33, 33]);
    const uneven = [
      { weightMinor: 2, vatRatePercent: 25 },
      { weightMinor: 1, vatRatePercent: 12 },
    ];
    expect(allocateShares({ totalExclVatMinor: 1_000, parts: uneven })).toEqual([667, 333]);
  });

  it("returns one row per rate and null when the parts carry no value", () => {
    const parts = [
      { weightMinor: 300, vatRatePercent: 12 },
      { weightMinor: 100, vatRatePercent: 25 },
      { weightMinor: 100, vatRatePercent: 12 },
    ];
    expect(allocateBundleVat({ totalExclVatMinor: 1_000, parts })).toEqual({
      rows: [
        { vatRatePercent: 12, totalExclVatMinor: 800, vatMinor: 96 },
        { vatRatePercent: 25, totalExclVatMinor: 200, vatMinor: 50 },
      ],
      missing: false,
    });
    const free = [{ weightMinor: 0, vatRatePercent: 12 }];
    expect(allocateBundleVat({ totalExclVatMinor: 1_000, parts: free })).toBeNull();
    const unknown = [{ weightMinor: 5, vatRatePercent: null }];
    expect(allocateBundleVat({ totalExclVatMinor: 10, parts: unknown })?.missing).toBe(true);
  });
});
