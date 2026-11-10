import { asVatRows } from "../quote/order-line-schema";
import type { CashInPeriod, InvoicedInPeriod } from "./load-facts";
import type { FinancePeriod } from "./period";
import type { FinanceMonth, RevenueByType, VatByRate } from "./schema";

type MonthOf = FinancePeriod["monthOf"];

const add = ({ map, key, amount }: { map: Map<string, number>; key: string; amount: number }) =>
  map.set(key, (map.get(key) ?? 0) + amount);

export type MonthlyInput = {
  months: readonly string[];
  monthOf: MonthOf;
  invoiced: InvoicedInPeriod;
  cash: CashInPeriod;
};

/** Invoiced (by send date) and received (payments minus refunds) per month; every month shown. */
export function monthly({ months, monthOf, invoiced, cash }: MonthlyInput): FinanceMonth[] {
  const billed = new Map<string, number>();
  const received = new Map<string, number>();
  for (const row of invoiced) {
    if (row.sentAt)
      add({ map: billed, key: monthOf({ instant: row.sentAt }), amount: row.totalExclVatMinor });
  }
  for (const row of cash.payments) {
    if (row.paidAt)
      add({ map: received, key: monthOf({ instant: row.paidAt }), amount: row.amountMinor });
  }
  for (const row of cash.refunds) {
    if (row.refundedAt)
      add({ map: received, key: monthOf({ instant: row.refundedAt }), amount: -row.amountMinor });
  }
  return months.map((month) => ({
    month,
    invoicedExclVatMinor: billed.get(month) ?? 0,
    receivedMinor: received.get(month) ?? 0,
  }));
}

/** Invoiced excluding VAT per item type, largest first; lines without an item group as null. */
export function revenueByType({ invoiced }: { invoiced: InvoicedInPeriod }): RevenueByType[] {
  const byType = new Map<string, RevenueByType>();
  for (const line of invoiced.flatMap((row) => row.lines)) {
    const type = line.item?.entityType ?? null;
    const key = type?.id ?? "";
    const entry = byType.get(key) ?? {
      entityTypeId: type?.id ?? null,
      name: type?.name ?? null,
      invoicedExclVatMinor: 0,
    };
    entry.invoicedExclVatMinor += line.totalExclVatMinor;
    byType.set(key, entry);
  }
  return [...byType.values()].sort((a, b) => b.invoicedExclVatMinor - a.invoicedExclVatMinor);
}

/** Invoiced and output VAT per rate, from the frozen `vatRows` (bundles split, ADR 0059). */
export function vatByRate({ invoiced }: { invoiced: InvoicedInPeriod }): VatByRate[] {
  const byRate = new Map<number, VatByRate>();
  for (const line of invoiced.flatMap((row) => row.lines)) {
    for (const vat of asVatRows({ value: line.vatRows })) {
      const entry = byRate.get(vat.vatRatePercent) ?? {
        vatRatePercent: vat.vatRatePercent,
        totalExclVatMinor: 0,
        vatMinor: 0,
      };
      entry.totalExclVatMinor += vat.totalExclVatMinor;
      entry.vatMinor += vat.vatMinor;
      byRate.set(vat.vatRatePercent, entry);
    }
  }
  return [...byRate.values()].sort((a, b) => b.vatRatePercent - a.vatRatePercent);
}
