import type { OperationContext } from "../../operations/types";
import { daysOverdue } from "./aging";

type Scope = { customerId?: string | undefined };
type Input = { context: Pick<OperationContext, "db">; end: Date } & Scope;

const ticketOf = ({ customerId }: Scope) => (customerId ? { ticket: { customerId } } : {});

/**
 * Every SENT invoice sent before `end`, with the payments and refunds against it: enough to
 * rebuild what was open, and overdue, at any instant (ADR 0086). Nothing is stored.
 */
export async function loadBalanceHistory({ context, end, customerId }: Input) {
  const invoices = await context.db.invoice.findMany({
    where: { status: "SENT", sentAt: { lt: end }, ...ticketOf({ customerId }) },
    select: { id: true, sentAt: true, dueDate: true, totalInclVatMinor: true },
  });
  const invoiceIds = invoices.map((invoice) => invoice.id);
  const [payments, refunds] = await Promise.all([
    context.db.payment.findMany({
      where: { invoiceId: { in: invoiceIds }, status: { in: ["SUCCEEDED", "REFUNDED"] } },
      select: { invoiceId: true, paidAt: true, amountMinor: true },
    }),
    context.db.paymentRefund.findMany({
      where: { payment: { invoiceId: { in: invoiceIds } } },
      select: { refundedAt: true, amountMinor: true, payment: { select: { invoiceId: true } } },
    }),
  ]);
  return { invoices, payments, refunds };
}

export type BalanceHistory = Awaited<ReturnType<typeof loadBalanceHistory>>;

const before = ({ at, instant }: { at: Date | null; instant: Date }) =>
  at !== null && at.getTime() <= instant.getTime();

/** What each invoice had been paid at `instant`: payments made minus refunds made by then. */
function paidAt({ history, instant }: { history: BalanceHistory; instant: Date }) {
  const paid = new Map<string, number>();
  const add = ({ id, amount }: { id: string | null; amount: number }) => {
    if (id) paid.set(id, (paid.get(id) ?? 0) + amount);
  };
  for (const row of history.payments) {
    if (before({ at: row.paidAt, instant })) add({ id: row.invoiceId, amount: row.amountMinor });
  }
  for (const row of history.refunds) {
    if (before({ at: row.refundedAt, instant }))
      add({ id: row.payment.invoiceId, amount: -row.amountMinor });
  }
  return paid;
}

export type OpenAtInput = { history: BalanceHistory; instant: Date; overdueOnly: boolean };

/** Open on invoices sent by `instant`, as it stood then; overdue = a whole day past due. */
export function openAt({ history, instant, overdueOnly }: OpenAtInput): number {
  const paid = paidAt({ history, instant });
  let open = 0;
  for (const invoice of history.invoices) {
    if (!before({ at: invoice.sentAt, instant })) continue;
    if (overdueOnly && daysOverdue({ dueDate: invoice.dueDate, now: instant }) <= 0) continue;
    open += Math.max(0, invoice.totalInclVatMinor - (paid.get(invoice.id) ?? 0));
  }
  return open;
}
