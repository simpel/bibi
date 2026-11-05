import { orderRoute, ROUTES } from "@/lib/routes";
import type { DashboardWireish } from "../ui/dashboard-wireish";

export type AttentionRow = { key: string; href: string; title: string; detail: string };

export type AttentionTexts = {
  /** "Title · Customer" (or "#12 · Customer" without a title) for an order row. */
  order: (row: { reference: number; title: string | null; customerName?: string | null }) => string;
  /** An instant as a date in the organization's zone. */
  date: (value: Date | string) => string;
  money: (minor: number) => string;
  overdue: (values: { count: number }) => string;
  expiring: (values: { count: number; date: string }) => string;
  unsent: (values: { runSheet: string; version: number; date: string }) => string;
};

/** Overdue money first, then expiring holds, then unsent run sheets; each linked to where it is handled. */
export function attentionRows({
  attention,
  texts,
}: {
  attention: DashboardWireish["attention"];
  texts: AttentionTexts;
}): AttentionRow[] {
  const { overdue } = attention;
  const late: AttentionRow[] = overdue?.invoices
    ? [
        {
          key: "overdue",
          href: ROUTES.financials,
          title: texts.overdue({ count: overdue.invoices }),
          detail: texts.money(overdue.totalMinor),
        },
      ]
    : [];
  const holds = attention.expiringHolds.map((row) => ({
    key: `hold-${row.orderId}`,
    href: orderRoute({ id: row.orderId }),
    title: texts.order(row),
    detail: texts.expiring({ count: row.lines, date: texts.date(row.holdsUntil) }),
  }));
  const runSheets = (attention.unsentRunSheets ?? []).map((row) => ({
    key: `run-sheet-${row.runSheetId}`,
    href: orderRoute({ id: row.orderId }),
    title: texts.order(row),
    detail: texts.unsent({
      runSheet: row.name,
      version: row.version,
      date: texts.date(row.startsAt),
    }),
  }));
  return [...late, ...holds, ...runSheets];
}
