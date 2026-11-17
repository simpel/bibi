import { describe, expect, it } from "vitest";
import { trialCountdown } from "./trial-countdown";

const now = new Date("2026-11-17T12:00:00Z");
const at = ({ hours }: { hours: number }) => new Date(now.getTime() + hours * 60 * 60 * 1000);

describe("trialCountdown", () => {
  it("counts whole days, rounded up, with the share left", () => {
    const value = trialCountdown({
      trialEndsAt: at({ hours: 14 * 24 }),
      trialDays: 14,
      canPay: true,
      now,
    });
    expect(value).toEqual({ unit: "days", count: 14, left: 1, urgent: false, canPay: true });
    expect(
      trialCountdown({ trialEndsAt: at({ hours: 30 }), trialDays: 14, canPay: false, now }),
    ).toMatchObject({ unit: "days", count: 2, urgent: true });
  });

  it("switches to hours on the last day and never shows zero", () => {
    expect(
      trialCountdown({ trialEndsAt: at({ hours: 5.5 }), trialDays: 14, canPay: true, now }),
    ).toMatchObject({ unit: "hours", count: 6 });
    expect(
      trialCountdown({ trialEndsAt: at({ hours: 0.01 }), trialDays: 14, canPay: true, now }).count,
    ).toBe(1);
  });

  it("caps the bar at full when the trial was extended", () => {
    expect(
      trialCountdown({ trialEndsAt: at({ hours: 40 * 24 }), trialDays: 14, canPay: true, now })
        .left,
    ).toBe(1);
  });
});
