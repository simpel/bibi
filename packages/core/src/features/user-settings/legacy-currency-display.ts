import type { MoneyFormat } from "../../number/number-formats";

export type LegacyCurrencyDisplayInput = { moneyFormat: MoneyFormat | null };

/**
 * Expand step (ADR 0013): also writes the old `currencyDisplay` column so the previous release
 * reads a matching code or symbol during a rollout. Remove with the column in the contract step.
 */
export function legacyCurrencyDisplay({ moneyFormat }: LegacyCurrencyDisplayInput) {
  if (moneyFormat === null) return { currencyDisplay: null };
  const code = moneyFormat === "CODE_COMMA" || moneyFormat === "SPACE_CODE";
  return { currencyDisplay: code ? ("CODE" as const) : ("SYMBOL" as const) };
}
