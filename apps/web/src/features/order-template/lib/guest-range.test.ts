import { describe, expect, it } from "vitest";
import { guestRange } from "./guest-range";

describe("guestRange", () => {
  it("writes both limits, one limit, a single number or a dash", () => {
    expect(guestRange({ min: 4, max: 30 })).toBe("4–30");
    expect(guestRange({ min: null, max: 30 })).toBe("≤ 30");
    expect(guestRange({ min: 4, max: null })).toBe("≥ 4");
    expect(guestRange({ min: 8, max: 8 })).toBe("8");
    expect(guestRange({ min: null, max: null })).toBe("–");
  });
});
