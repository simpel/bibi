import { describe, expect, it } from "vitest";
import { statSeries, statTrend } from "./stat-trend";

const texts = {
  value: ({ value }: { value: number }) => `${value} kr`,
  bucket: ({ bucket }: { bucket: string }) => bucket.slice(5),
  percent: ({ value }: { value: number }) => `${value > 0 ? "+" : ""}${value} %`,
  description: "vs. previous",
};
const trend = ({ current, previous }: { current: number; previous: number | null }) => ({
  series: [{ bucket: "2026-11-01", value: current }],
  current,
  previous,
});

describe("stat trend (ADR 0086)", () => {
  it("colours a rise green when up is good and red when it is not", () => {
    expect(
      statTrend({ trend: trend({ current: 120, previous: 100 }), polarity: "upIsGood", texts }),
    ).toMatchObject({
      direction: "up",
      tone: "good",
      text: "+20 %",
    });
    expect(
      statTrend({ trend: trend({ current: 120, previous: 100 }), polarity: "downIsGood", texts })
        ?.tone,
    ).toBe("bad");
  });

  it("shows no percentage without a previous value, and flat when unchanged", () => {
    expect(
      statTrend({ trend: trend({ current: 5, previous: 0 }), polarity: "upIsGood", texts }),
    ).toBeNull();
    expect(
      statTrend({ trend: trend({ current: 5, previous: null }), polarity: "upIsGood", texts }),
    ).toBeNull();
    expect(
      statTrend({ trend: trend({ current: 100, previous: 100 }), polarity: "upIsGood", texts })
        ?.tone,
    ).toBe("neutral");
  });

  it("labels and writes out every point", () => {
    expect(statSeries({ trend: trend({ current: 7, previous: 1 }), texts })).toEqual([
      { label: "11-01", value: 7, text: "7 kr" },
    ]);
  });
});
