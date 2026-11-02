import type { AccountingEvent, Settles } from "../../accounting/sie4/events";
import type { OperationContext } from "../../operations/types";
import { toIsoDate } from "../../time/plain-date";
import { toZonedParts } from "../../time/zoned-time";
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

type InvoiceInput = Build & {
  invoice: SourceInvoice;
  kind: "INVOICE_SENT" | "INVOICE_VOID";
};

function invoiceEvent({ invoice, kind, ...build }: InvoiceInput): PendingEvent {
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
      // Exactly the deposits the invoice deducts move from customer advances (ADR 0090).
      depositOffsetMinor: invoice.deductions.reduce((sum, d) => sum + d.amountMinor, 0),
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
export async function pendingEvents({ sources, ...build }: PendingEventsInput) {
  return [
    ...sources.sent.map((invoice) => invoiceEvent({ ...build, invoice, kind: "INVOICE_SENT" })),
    ...sources.voided.map((invoice) => invoiceEvent({ ...build, invoice, kind: "INVOICE_VOID" })),
    ...paymentEvents({ ...build, sources }),
  ];
}
