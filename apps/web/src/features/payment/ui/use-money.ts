import { useFormatter } from "next-intl";

export type MoneyInput = { minor: number; currency?: string };

/** Formats minor units (öre) as a localized currency amount, SEK unless told otherwise. */
export function useMoney() {
  const format = useFormatter();
  return ({ minor, currency = "SEK" }: MoneyInput) =>
    format.number(minor / 100, { style: "currency", currency });
}
