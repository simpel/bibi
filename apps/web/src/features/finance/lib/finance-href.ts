import { ROUTES } from "@/lib/routes";
import type { Period } from "./finance-period";

export type PeriodHrefInput = Period & {
  /** The page the period is in the path of, e.g. `ROUTES.financials`. */
  base: string;
  customerId?: string | undefined;
};

/** `{base}/{from}/{to}`, narrowed to one customer with `?customer=` (inclusive plain days, ADR 0064). */
export function periodHref({ base, from, to, customerId }: PeriodHrefInput): string {
  const path = `${base}/${from}/${to}`;
  return customerId ? `${path}?customer=${encodeURIComponent(customerId)}` : path;
}

export type FinancialsHrefInput = Period & { customerId?: string | undefined };

/** `/financials/{from}/{to}`, narrowed to one customer. */
export function financialsHref({ from, to, customerId }: FinancialsHrefInput): string {
  return periodHref({ base: ROUTES.financials, from, to, customerId });
}
