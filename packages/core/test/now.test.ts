import { describe, expect, it } from "vitest";
import { nowOf } from "../src/time/now";

describe("nowOf", () => {
  it("reads the context clock when set", () => {
    const instant = new Date("2026-01-15T10:00:00Z");
    expect(nowOf({ context: { now: () => instant } })).toBe(instant);
  });

  it("falls back to real time", () => {
    const before = Date.now();
    expect(nowOf({ context: {} }).getTime()).toBeGreaterThanOrEqual(before);
  });
});
