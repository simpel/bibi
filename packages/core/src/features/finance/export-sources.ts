import type { OperationContext } from "../../operations/types";

type Db = { context: Pick<OperationContext, "db"> };

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

type Kind = "INVOICE_SENT" | "INVOICE_VOID" | "PAYMENT" | "FEE";

const notAs = ({ kind }: { kind: Kind }) => ({ exportEntries: { none: { kind } } });

/** SENT invoices not exported, and VOID ones whose send was exported but not their void. */
function loadInvoices({ context }: Db) {
  return Promise.all([
    context.db.invoice.findMany({
      where: { status: "SENT", sentAt: { not: null }, ...notAs({ kind: "INVOICE_SENT" }) },
      select: INVOICE_SELECT,
    }),
    context.db.invoice.findMany({
      where: {
        status: "VOID",
        voidedAt: { not: null },
        AND: [
          { exportEntries: { some: { kind: "INVOICE_SENT" } } },
          notAs({ kind: "INVOICE_VOID" }),
        ],
      },
      select: INVOICE_SELECT,
    }),
  ]);
}

/** Settled payments, their application fees and their refunds not exported yet. */
function loadCash({ context }: Db) {
  const settled = { status: SETTLED, paidAt: { not: null } };
  return Promise.all([
    context.db.payment.findMany({
      where: { ...settled, ...notAs({ kind: "PAYMENT" }) },
      select: PAYMENT_SELECT,
    }),
    context.db.payment.findMany({
      where: { ...settled, applicationFeeMinor: { gt: 0 }, ...notAs({ kind: "FEE" }) },
      select: PAYMENT_SELECT,
    }),
    context.db.paymentRefund.findMany({
      where: { exportEntries: { none: {} } },
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
 * Every fact no export has contained yet (ADR 0077): SENT invoices, VOID invoices whose send was
 * exported (a void before its export is never exported at all), settled payments, their fees
 * and refunds. The entries' unique keys make this "not exported" exactly once.
 */
export async function loadExportSources({ context }: Db) {
  const [[sent, voided], [payments, fees, refunds]] = await Promise.all([
    loadInvoices({ context }),
    loadCash({ context }),
  ]);
  return { sent, voided, payments, fees, refunds };
}

export type ExportSources = Awaited<ReturnType<typeof loadExportSources>>;
export type SourceInvoice = ExportSources["sent"][number];
export type SourcePayment = ExportSources["payments"][number];
