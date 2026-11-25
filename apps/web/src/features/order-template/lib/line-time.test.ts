import { describe, expect, it } from "vitest";
import { splitMinutes } from "./line-time";

describe("splitMinutes", () => {
  it("splits into whole hours and the rest", () => {
    expect(splitMinutes({ minutes: 90 })).toEqual({ hours: 1, minutes: 30 });
    expect(splitMinutes({ minutes: 45 })).toEqual({ hours: 0, minutes: 45 });
    expect(splitMinutes({ minutes: 120 })).toEqual({ hours: 2, minutes: 0 });
  });
});
