import type { NumberFormat } from "@bibi/core/schemas";

export type WholeMoneyInput = { numbers: NumberFormat; minor: number; currency: string };

/**
 * An amount in whole currency units, written in the viewer's money format: an overview figure,
 * not an amount to the öre (as the pipeline's phase totals).
 */
export function wholeMoney({ numbers, minor, currency }: WholeMoneyInput): string {
  const rounded = Math.round(minor / 100) * 100;
  const full = numbers.money({ minor: rounded, currency });
  const amount = numbers.amount({ minor: rounded });
  // The amount always ends in a separator and two zeros: drop those three characters.
  return full.replace(amount, amount.slice(0, -3));
}
