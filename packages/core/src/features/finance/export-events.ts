import type { AccountingEvent, Settles } from "../../accounting/sie4/events";
import type { OperationContext } from "../../operations/types";
import { toIsoDate } from "../../time/plain-date";
import { toZonedParts } from "../../time/zoned-time";
import { paidByReceivable } from "../payment/settlement";
import { type RevenueAccountOf, revenueParts } from "./account-map";
import type { ExportSources, SourceInvoice, SourcePayment } from "./export-sources";

/** The export entry an event becomes: its kind and its one source (ADR 0077). */
export type ExportEntry =
  | { kind: "INVOICE_SENT" | "INVOICE_VOID"; invoiceId: string }
  | { kind: "PAYMENT" | "FEE"; paymentId: string }
  | { kind: "REFUND"; refundId: string };

export type PendingEvent = { event: AccountingEvent; entry: ExportEntry };

type Build = { timeZone: string; accountOf: RevenueAccountOf };

const dateOf = ({ instant, timeZone }: { instant: Date; timeZone: string }) =>
  toIsoDate({ date: toZonedParts({ instant, timeZone }).date });

/** Paid deposits per ticket: moved from customer advances to receivables when invoiced. */
async function depositsPaid({
  context,
  ticketIds,
}: {
  context: Pick<OperationContext, "db">;
  ticketIds: string[];
}): Promise<Map<string, number>> {
  const [deposits, paid] = await Promise.all([
    context.db.deposit.findMany({
      where: { ticketId: { in: ticketIds }, status: { not: "VOID" } },
      select: { id: true, ticketId: true },
    }),
    paidByReceivable({ context, ticketIds }),
  ]);
  const byTicket = new Map<string, number>();
  for (const deposit of deposits) {
    const amount = paid.get(deposit.id) ?? 0;
    byTicket.set(deposit.ticketId, (byTicket.get(deposit.ticketId) ?? 0) + amount);
  }
  return byTicket;
}

type InvoiceInput = Build & {
  invoice: SourceInvoice;
  kind: "INVOICE_SENT" | "INVOICE_VOID";
  offsets: Map<string, number>;
};

function invoiceEvent({ invoice, kind, offsets, ...build }: InvoiceInput): PendingEvent {
  const instant = (kind === "INVOICE_SENT" ? invoice.sentAt : invoice.voidedAt) ?? new Date();
  return {
    entry: { kind, invoiceId: invoice.id },
    event: {
      kind,
      date: dateOf({ instant, timeZone: build.timeZone }),
      ticketReference: invoice.ticket.reference,
      invoiceNumber: invoice.number,
      totalInclVatMinor: invoice.totalInclVatMinor,
      parts: revenueParts({ lines: invoice.lines, accountOf: build.accountOf }),
      depositOffsetMinor: offsets.get(invoice.ticketId) ?? 0,
    },
  };
}

/** What a payment settled: its invoice, a deposit, or the accepted quote's lines. */
function settlesOf({
  payment,
  accountOf,
}: {
  payment: SourcePayment;
  accountOf: RevenueAccountOf;
}): Settles {
  if (payment.invoice) return { kind: "INVOICE", invoiceNumber: payment.invoice.number };
  if (payment.quote)
    return { kind: "QUOTE", parts: revenueParts({ lines: payment.quote.lines, accountOf }) };
  return { kind: "DEPOSIT" };
}

function paymentEvents({ sources, ...build }: Build & { sources: ExportSources }): PendingEvent[] {
  const base = ({ payment, instant }: { payment: SourcePayment; instant: Date }) => ({
    date: dateOf({ instant, timeZone: build.timeZone }),
    ticketReference: payment.ticket.reference,
  });
  const paidAt = ({ payment }: { payment: { paidAt: Date | null } }) =>
    payment.paidAt ?? new Date();
  return [
    ...sources.payments.map((payment) => ({
      entry: { kind: "PAYMENT" as const, paymentId: payment.id },
      event: {
        ...base({ payment, instant: paidAt({ payment }) }),
        kind: "PAYMENT" as const,
        amountMinor: payment.amountMinor,
        settles: settlesOf({ payment, accountOf: build.accountOf }),
      },
    })),
    ...sources.fees.map((payment) => ({
      entry: { kind: "FEE" as const, paymentId: payment.id },
      event: {
        ...base({ payment, instant: paidAt({ payment }) }),
        kind: "FEE" as const,
        amountMinor: payment.applicationFeeMinor ?? 0,
      },
    })),
    ...sources.refunds.map((refund) => ({
      entry: { kind: "REFUND" as const, refundId: refund.id },
      event: {
        ...base({ payment: refund.payment, instant: refund.refundedAt }),
        kind: "REFUND" as const,
        amountMinor: refund.amountMinor,
        settles: settlesOf({ payment: refund.payment, accountOf: build.accountOf }),
      },
    })),
  ];
}

export type PendingEventsInput = Build & {
  context: Pick<OperationContext, "db">;
  sources: ExportSources;
};

/** Every pending event with the entry that records it (ADR 0077). */
export async function pendingEvents({ context, sources, ...build }: PendingEventsInput) {
  const invoices = [...sources.sent, ...sources.voided];
  const offsets = await depositsPaid({
    context,
    ticketIds: [...new Set(invoices.map((i) => i.ticketId))],
  });
  return [
    ...sources.sent.map((invoice) =>
      invoiceEvent({ ...build, invoice, kind: "INVOICE_SENT", offsets }),
    ),
    ...sources.voided.map((invoice) =>
      invoiceEvent({ ...build, invoice, kind: "INVOICE_VOID", offsets }),
    ),
    ...paymentEvents({ ...build, sources }),
  ];
}
