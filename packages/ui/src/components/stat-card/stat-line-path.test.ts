import { describe, expect, it } from "vitest";
import { statLinePath, statLinePoints } from "./stat-line-path";

const size = { width: 100, height: 40, padY: 4 };

describe("statLinePoints", () => {
  it("scales min to the bottom and max to the top", () => {
    expect(statLinePoints({ values: [1, 5, 3], ...size })).toEqual([
      { x: 0, y: 36 },
      { x: 50, y: 4 },
      { x: 100, y: 20 },
    ]);
  });

  it("puts a flat series in the middle", () => {
    expect(statLinePoints({ values: [7, 7, 7], ...size }).map((point) => point.y)).toEqual([
      20, 20, 20,
    ]);
  });
});

describe("statLinePath", () => {
  it("closes the area down to the bottom edge", () => {
    const { line, area } = statLinePath({ values: [1, 2], ...size });
    expect(line.startsWith("M0 36 C")).toBe(true);
    expect(area.endsWith("L100 40 L0 40 Z")).toBe(true);
  });

  it("returns empty paths without values", () => {
    expect(statLinePath({ values: [], ...size })).toEqual({ points: [], line: "", area: "" });
  });
});
