import { describe, expect, it } from "vitest";
import { formatCountdown, secondsLeft } from "./format-countdown";

describe("countdown", () => {
  it("formats minutes and padded seconds", () => {
    expect(formatCountdown({ seconds: 600 })).toBe("10:00");
    expect(formatCountdown({ seconds: 65 })).toBe("1:05");
    expect(formatCountdown({ seconds: -3 })).toBe("0:00");
  });

  it("counts whole seconds to the expiry and clamps at zero", () => {
    const now = Date.parse("2026-01-01T00:00:00Z");
    expect(secondsLeft({ expiresAt: "2026-01-01T00:10:00Z", now })).toBe(600);
    expect(secondsLeft({ expiresAt: "2025-12-31T23:59:00Z", now })).toBe(0);
    expect(secondsLeft({ expiresAt: "nope", now })).toBe(0);
  });
});
