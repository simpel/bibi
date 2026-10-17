import { describe, expect, it } from "vitest";
import { DEFAULT_TIME_ZONE } from "./time-zone";

describe("DEFAULT_TIME_ZONE", () => {
  it("renders the same wall time on a UTC host", () => {
    const instant = new Date("2026-01-15T08:00:00.000Z");
    const text = new Intl.DateTimeFormat("en-GB", {
      timeZone: DEFAULT_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
    }).format(instant);
    expect(text).toBe("09:00");
  });
});
