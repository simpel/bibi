import { ROUTES, ticketRoute } from "@/lib/routes";
import type { DashboardWireish } from "../ui/dashboard-wireish";

export type AttentionRow = { key: string; href: string; title: string; detail: string };

export type AttentionTexts = {
  /** "Title · Customer" (or "#12 · Customer" without a title) for a ticket row. */
  ticket: (row: {
    reference: number;
    title: string | null;
    customerName?: string | null;
  }) => string;
  /** An instant as a date in the organization's zone. */
  date: (value: Date | string) => string;
  money: (minor: number) => string;
  overdue: (values: { count: number }) => string;
  expiring: (values: { count: number; date: string }) => string;
  unsent: (values: { workOrder: string; version: number; date: string }) => string;
};

/** Overdue money first, then expiring holds, then unsent work orders; each linked to where it is handled. */
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
    key: `hold-${row.ticketId}`,
    href: ticketRoute({ id: row.ticketId }),
    title: texts.ticket(row),
    detail: texts.expiring({ count: row.lines, date: texts.date(row.holdsUntil) }),
  }));
  const workOrders = (attention.unsentWorkOrders ?? []).map((row) => ({
    key: `work-order-${row.workOrderId}`,
    href: ticketRoute({ id: row.ticketId }),
    title: texts.ticket(row),
    detail: texts.unsent({
      workOrder: row.name,
      version: row.version,
      date: texts.date(row.startsAt),
    }),
  }));
  return [...late, ...holds, ...workOrders];
}
