export type ElapsedInput = { since: number };

/** Milliseconds since `since` (a `performance.now()` reading), rounded to 0.1 ms. */
export function elapsedMs({ since }: ElapsedInput): number {
  return Math.round((performance.now() - since) * 10) / 10;
}
