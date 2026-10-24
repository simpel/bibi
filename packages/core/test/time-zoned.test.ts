import { describe, expect, it } from "vitest";
import { addDays } from "../src/time/plain-date";
import { fromZonedParts, toZonedParts } from "../src/time/zoned-time";

const timeZone = "Europe/Stockholm";
const at = ({
  y,
  m,
  d,
  h = 0,
  min = 0,
}: {
  y: number;
  m: number;
  d: number;
  h?: number;
  min?: number;
}) =>
  fromZonedParts({
    date: { year: y, month: m, day: d },
    time: { hour: h, minute: min, second: 0 },
    timeZone,
  });
const hoursBetween = ({ from, to }: { from: Date; to: Date }) =>
  (to.getTime() - from.getTime()) / 3_600_000;

describe("zoned time across daylight saving (ADR 0064)", () => {
  it("moves a wall time in the spring gap forward to the first valid time", () => {
    // 2026-03-29: 02:00 CET jumps to 03:00 CEST, so 02:30 does not exist.
    expect(at({ y: 2026, m: 3, d: 29, h: 2, min: 30 }).toISOString()).toBe(
      "2026-03-29T01:30:00.000Z",
    );
    expect(at({ y: 2026, m: 3, d: 29, h: 3 }).toISOString()).toBe("2026-03-29T01:00:00.000Z");
  });

  it("takes the earlier instant for an ambiguous wall time in the autumn overlap", () => {
    // 2026-10-25: 03:00 CEST falls back to 02:00 CET, so 02:30 happens twice (00:30Z and 01:30Z).
    expect(at({ y: 2026, m: 10, d: 25, h: 2, min: 30 }).toISOString()).toBe(
      "2026-10-25T00:30:00.000Z",
    );
  });

  it("round-trips wall times that exist exactly once", () => {
    const instant = at({ y: 2026, m: 7, d: 1, h: 13, min: 15 });
    expect(toZonedParts({ instant, timeZone })).toEqual({
      date: { year: 2026, month: 7, day: 1 },
      time: { hour: 13, minute: 15, second: 0 },
    });
  });

  it("makes the day of the spring change 23 hours and the autumn change 25", () => {
    const length = ({ y, m, d }: { y: number; m: number; d: number }) => {
      const next = addDays({ date: { year: y, month: m, day: d }, days: 1 });
      return hoursBetween({
        from: at({ y, m, d }),
        to: at({ y: next.year, m: next.month, d: next.day }),
      });
    };
    expect(length({ y: 2026, m: 3, d: 29 })).toBe(23);
    expect(length({ y: 2026, m: 10, d: 25 })).toBe(25);
    expect(length({ y: 2026, m: 6, d: 1 })).toBe(24);
  });
});
