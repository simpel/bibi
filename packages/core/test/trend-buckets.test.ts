import { describe, expect, it } from "vitest";
import { bucketsOf, previousRange } from "../src/trend/buckets";
import { snapshotTrend, sumTrend } from "../src/trend/series";

const day = ({ value }: { value: string }) => ({
  year: Number(value.slice(0, 4)),
  month: Number(value.slice(5, 7)),
  day: Number(value.slice(8, 10)),
});
const zone = "Europe/Stockholm";

describe("trend buckets (ADR 0086)", () => {
  it("uses days up to 31 days, weeks to six months and months beyond", () => {
    const of = ({ from, to }: { from: string; to: string }) =>
      bucketsOf({ from: day({ value: from }), to: day({ value: to }), timeZone: zone });
    expect(of({ from: "2026-11-01", to: "2026-11-30" })).toMatchObject({ size: "DAY" });
    expect(of({ from: "2026-11-01", to: "2026-11-30" }).buckets).toHaveLength(30);
    const weeks = of({ from: "2026-09-01", to: "2026-11-30" });
    expect(weeks.size).toBe("WEEK");
    expect(weeks.buckets.at(-1)?.end).toEqual(
      of({ from: "2026-12-01", to: "2026-12-01" }).buckets[0]?.start,
    );
    const months = of({ from: "2025-12-01", to: "2026-11-30" });
    expect([months.size, months.buckets.length]).toEqual(["MONTH", 12]);
  });

  it("compares with the range of equal length just before", () => {
    expect(
      previousRange({ from: day({ value: "2026-11-01" }), to: day({ value: "2026-11-30" }) }),
    ).toEqual({
      from: day({ value: "2026-10-02" }),
      to: day({ value: "2026-10-31" }),
    });
  });

  it("sums per bucket and keeps snapshots to what is known by now", () => {
    const { buckets } = bucketsOf({
      from: day({ value: "2026-11-01" }),
      to: day({ value: "2026-11-03" }),
      timeZone: zone,
    });
    const [first, second] = buckets;
    if (!first || !second) throw new Error("No buckets");
    const facts = [
      { at: first.start, amount: 5 },
      { at: second.start, amount: 7 },
    ];
    expect(sumTrend({ buckets, facts, previous: [{ at: new Date(0), amount: 4 }] })).toMatchObject({
      current: 12,
      previous: 4,
    });
    const now = new Date(second.start.getTime() + 60_000);
    const snapshot = snapshotTrend({ buckets, now, valueAt: ({ instant }) => instant.getTime() });
    expect(snapshot.series).toHaveLength(2);
    expect([snapshot.current, snapshot.previous]).toEqual([now.getTime(), first.start.getTime()]);
  });
});
