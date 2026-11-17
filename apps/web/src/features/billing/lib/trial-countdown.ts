const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** The last days of the trial, when the sidebar's countdown turns to a warning. */
const URGENT_DAYS = 3;

/**
 * The sidebar's trial countdown (ADR 0095 §4): what is left, in whole days or, on the last
 * day, hours; `left` is the share of the trial still to go (0–1) for the bar.
 */
export type TrialCountdown = {
  unit: "days" | "hours";
  count: number;
  left: number;
  urgent: boolean;
  canPay: boolean;
};

export type TrialCountdownInput = {
  trialEndsAt: Date;
  trialDays: number;
  canPay: boolean;
  now?: Date;
};

/** Days left rounded up (a trial ending tomorrow afternoon is "2 days"), hours on the last day. */
export function trialCountdown({
  trialEndsAt,
  trialDays,
  canPay,
  now = new Date(),
}: TrialCountdownInput): TrialCountdown {
  const remaining = Math.max(0, trialEndsAt.getTime() - now.getTime());
  const left = Math.min(1, remaining / (trialDays * DAY_MS));
  const days = Math.ceil(remaining / DAY_MS);
  const urgent = days <= URGENT_DAYS;
  if (days > 1) return { unit: "days", count: days, left, urgent, canPay };
  return {
    unit: "hours",
    count: Math.max(1, Math.ceil(remaining / HOUR_MS)),
    left,
    urgent,
    canPay,
  };
}
