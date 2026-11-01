import { ROUTES } from "@/lib/routes";
import type { Period } from "./finance-period";

export type FinancialsHrefInput = Period & { customerId?: string | undefined };

/** `/financials/{from}/{to}`, narrowed to one customer with `?customer=` (inclusive plain days, ADR 0064). */
export function financialsHref({ from, to, customerId }: FinancialsHrefInput): string {
  const path = `${ROUTES.financials}/${from}/${to}`;
  return customerId ? `${path}?customer=${encodeURIComponent(customerId)}` : path;
}
