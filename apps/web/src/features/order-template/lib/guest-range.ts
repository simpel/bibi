export type GuestRangeInput = { min: number | null; max: number | null };

/** A template's guest range as text: "4–30", "≤ 30", "≥ 4", "8", or "–" without limits. */
export function guestRange({ min, max }: GuestRangeInput): string {
  if (min === null && max === null) return "–";
  if (min === null) return `≤ ${max}`;
  if (max === null) return `≥ ${min}`;
  return min === max ? String(min) : `${min}–${max}`;
}
