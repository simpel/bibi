import { describe, expect, it } from "vitest";
import { extrapolateSeries } from "./extrapolate";

describe("extrapolateSeries", () => {
  it("returns zeros when history is empty", () => {
    const result = extrapolateSeries({ history: [], horizonCount: 3 });
    expect(result.forecast).toEqual([0, 0, 0]);
  });

  it("extrapolates single point baseline", () => {
    const result = extrapolateSeries({ history: [1000], horizonCount: 3 });
    expect(result.forecast).toEqual([1000, 1000, 1000]);
  });

  it("projects positive upward trend", () => {
    const history = [100, 200, 300];
    const result = extrapolateSeries({ history, horizonCount: 3 });
    expect(result.forecast.length).toBe(3);
    const [first = 0, second = 0] = result.forecast;
    expect(first).toBeGreaterThan(300);
    expect(second).toBeGreaterThan(first);
  });

  it("never returns negative values", () => {
    const history = [1000, 500, 100];
    const result = extrapolateSeries({ history, horizonCount: 5 });
    for (const val of result.forecast) {
      expect(val).toBeGreaterThanOrEqual(0);
    }
  });
});
