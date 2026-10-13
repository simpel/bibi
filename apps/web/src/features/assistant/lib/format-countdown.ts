export type FormatCountdownInput = { seconds: number };

/** `m:ss` for a countdown; negative values clamp to `0:00`. */
export function formatCountdown({ seconds }: FormatCountdownInput): string {
  const total = Math.max(0, Math.floor(seconds));
  const rest = String(total % 60).padStart(2, "0");
  return `${Math.floor(total / 60)}:${rest}`;
}

export type SecondsLeftInput = { expiresAt: string; now: number };

/** Whole seconds until an ISO timestamp (never below 0; invalid dates count as expired). */
export function secondsLeft({ expiresAt, now }: SecondsLeftInput): number {
  const end = Date.parse(expiresAt);
  return Number.isNaN(end) ? 0 : Math.max(0, Math.ceil((end - now) / 1000));
}
