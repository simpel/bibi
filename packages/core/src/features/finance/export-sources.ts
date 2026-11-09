import type { OperationContext } from "../../operations/types";
import type { ProviderKey } from "../../providers/provider-keys";
import { ledgerProviderKeys } from "../../providers/registry";

const SETTLED = { in: ["SUCCEEDED" as const, "REFUNDED" as const] };
const LINES = {
  where: { inTotal: true },
  select: { itemId: true, vatRows: true, item: { select: { entityTypeId: true } } },
} as const;
const ORDER = { select: { reference: true } } as const;

/** What a payment settled, as the voucher needs it: an invoice's number or a quote's lines. */
const PAYMENT_SELECT = {
  id: true,
  orderId: true,
  amountMinor: true,
  applicationFeeMinor: true,
  paidAt: true,
  provider: true,
  depositId: true,
  deposit: { select: { vatRows: true } },
  order: ORDER,
  invoice: { select: { number: true, provider: true } },
  quote: { select: { lines: LINES } },
} as const;

const INVOICE_SELECT = {
  id: true,
  number: true,
  orderId: true,
  sentAt: true,
  voidedAt: true,
  totalInclVatMinor: true,
  totalExclVatMinor: true,
  provider: true,
  order: ORDER,
  lines: LINES,
  deductions: { select: { amountMinor: true, deposit: { select: { vatRows: true } } } },
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
      where: { status: "SUCCEEDED", refundedAt: within({ period }) },
      select: {
        id: true,
        amountMinor: true,
        refundedAt: true,
        payment: { select: PAYMENT_SELECT },
      },
    }),
  ]);
}

/** Credit notes issued in the range, with their own frozen lines and their invoice. */
function loadCreditNotes({ context, period }: Sources) {
  return context.db.creditNote.findMany({
    where: { status: "ISSUED", issuedAt: within({ period }) },
    select: {
      id: true,
      number: true,
      issuedAt: true,
      amountMinor: true,
      lines: LINES,
      invoice: { select: INVOICE_SELECT },
    },
  });
}

type Booked = { provider: ProviderKey | null };

/**
 * A ledger provider keeps the books for what it invoices (ADR 0100): its invoices, the payments
 * on them and payments it took are left to it. Awaits an accountant's confirmation (ADR 0093).
 */
function ownBooks({ ledger }: { ledger: readonly ProviderKey[] }) {
  const inLedger = ({ row }: { row: Booked | null }) =>
    row?.provider != null && ledger.includes(row.provider);
  return {
    invoice: (row: Booked) => !inLedger({ row }),
    payment: (row: Booked & { invoice: Booked | null }) =>
      !inLedger({ row }) && !inLedger({ row: row.invoice }),
  };
}

/**
 * Every fact dated in the range (ADR 0077, addendum): invoices by send date, voids by void date,
 * settled payments and their fees by `paidAt`, refunds by refund date. Facts exported before are
 * included again, so a range can be exported any number of times. Credit notes by issue date.
 * What a ledger provider books is left out (`ownBooks`).
 */
export async function loadExportSources({ context, period }: Sources) {
  const [[sent, voided], [payments, fees, refunds], creditNotes] = await Promise.all([
    loadInvoices({ context, period }),
    loadCash({ context, period }),
    loadCreditNotes({ context, period }),
  ]);
  const keep = ownBooks({ ledger: ledgerProviderKeys() });
  return {
    sent: sent.filter(keep.invoice),
    voided: voided.filter(keep.invoice),
    creditNotes: creditNotes.filter((note) => keep.invoice(note.invoice)),
    payments: payments.filter(keep.payment),
    fees: fees.filter(keep.payment),
    refunds: refunds.filter((refund) => keep.payment(refund.payment)),
  };
}

export type ExportSources = Awaited<ReturnType<typeof loadExportSources>>;
export type SourceInvoice = ExportSources["sent"][number];
export type SourcePayment = ExportSources["payments"][number];
export type SourceCreditNote = ExportSources["creditNotes"][number];
