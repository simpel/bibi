import type { OperationContext } from "../../operations/types";

const SETTLED = { in: ["SUCCEEDED" as const, "REFUNDED" as const] };
const LINES = {
  where: { inTotal: true },
  select: { itemId: true, vatRows: true, item: { select: { entityTypeId: true } } },
} as const;
const TICKET = { select: { reference: true } } as const;

/** What a payment settled, as the voucher needs it: an invoice's number or a quote's lines. */
const PAYMENT_SELECT = {
  id: true,
  ticketId: true,
  amountMinor: true,
  applicationFeeMinor: true,
  paidAt: true,
  depositId: true,
  ticket: TICKET,
  invoice: { select: { number: true } },
  quote: { select: { lines: LINES } },
} as const;

const INVOICE_SELECT = {
  id: true,
  number: true,
  ticketId: true,
  sentAt: true,
  voidedAt: true,
  totalInclVatMinor: true,
  ticket: TICKET,
  lines: LINES,
} as const;

type Range = { start: Date; end: Date };
type Sources = { context: Pick<OperationContext, "db">; period: Range };

const within = ({ period }: { period: Range }) => ({ gte: period.start, lt: period.end });

/** Invoices sent in the range, and those voided in it (the reversal of a send, whenever it was). */
function loadInvoices({ context, period }: Sources) {
  return Promise.all([
    context.db.invoice.findMany({
      where: { sentAt: within({ period }) },
      select: INVOICE_SELECT,
    }),
    context.db.invoice.findMany({
      where: { sentAt: { not: null }, voidedAt: within({ period }) },
      select: INVOICE_SELECT,
    }),
  ]);
}

/** Payments settled in the range, their application fees, and the refunds made in it. */
function loadCash({ context, period }: Sources) {
  const settled = { status: SETTLED, paidAt: within({ period }) };
  return Promise.all([
    context.db.payment.findMany({ where: settled, select: PAYMENT_SELECT }),
    context.db.payment.findMany({
      where: { ...settled, applicationFeeMinor: { gt: 0 } },
      select: PAYMENT_SELECT,
    }),
    context.db.paymentRefund.findMany({
      where: { refundedAt: within({ period }) },
      select: {
        id: true,
        amountMinor: true,
        refundedAt: true,
        payment: { select: PAYMENT_SELECT },
      },
    }),
  ]);
}

/**
 * Every fact dated in the range (ADR 0077, addendum): invoices by send date, voids by void date,
 * settled payments and their fees by `paidAt`, refunds by refund date. Facts exported before are
 * included again, so a range can be exported any number of times.
 */
export async function loadExportSources({ context, period }: Sources) {
  const [[sent, voided], [payments, fees, refunds]] = await Promise.all([
    loadInvoices({ context, period }),
    loadCash({ context, period }),
  ]);
  return { sent, voided, payments, fees, refunds };
}

export type ExportSources = Awaited<ReturnType<typeof loadExportSources>>;
export type SourceInvoice = ExportSources["sent"][number];
export type SourcePayment = ExportSources["payments"][number];
