import type { OperationContext } from "../../operations/types";
import { paidForInvoices } from "../payment/settlement";
import type { FinancePeriod } from "./period";

type Scope = { customerId?: string | undefined };
type Db = { context: Pick<OperationContext, "db"> } & Scope;

export type FactsInput = Db & { period: Pick<FinancePeriod, "start" | "end"> };

/** The ticket filter that narrows a fact to one customer; empty for the whole organization. */
const ticketOf = ({ customerId }: Scope) => (customerId ? { ticket: { customerId } } : {});

const LINE_SELECT = {
  totalExclVatMinor: true,
  vatRows: true,
  item: { select: { entityType: { select: { id: true, name: true } } } },
} as const;

/** SENT invoices sent in the period, with the lines that count (not void: a void is reversed). */
export function loadInvoicedInPeriod({ context, period, customerId }: FactsInput) {
  return context.db.invoice.findMany({
    where: {
      status: "SENT",
      sentAt: { gte: period.start, lt: period.end },
      ...ticketOf({ customerId }),
    },
    select: {
      sentAt: true,
      totalExclVatMinor: true,
      lines: { where: { inTotal: true }, select: LINE_SELECT },
    },
  });
}

export type InvoicedInPeriod = Awaited<ReturnType<typeof loadInvoicedInPeriod>>;

/** Settled payments by `paidAt` and refunds by `refundedAt` in the period (ADR 0077). */
export async function loadCashInPeriod({ context, period, customerId }: FactsInput) {
  const when = { gte: period.start, lt: period.end };
  const [payments, refunds] = await Promise.all([
    context.db.payment.findMany({
      where: {
        status: { in: ["SUCCEEDED", "REFUNDED"] },
        paidAt: when,
        ...ticketOf({ customerId }),
      },
      select: { paidAt: true, amountMinor: true },
    }),
    context.db.paymentRefund.findMany({
      where: { refundedAt: when, payment: ticketOf({ customerId }) },
      select: { refundedAt: true, amountMinor: true },
    }),
  ]);
  return { payments, refunds };
}

export type CashInPeriod = Awaited<ReturnType<typeof loadCashInPeriod>>;

/** Every SENT invoice with what is still open on it, today. */
export async function loadOpenInvoices({ context, customerId }: Db) {
  const invoices = await context.db.invoice.findMany({
    where: { status: "SENT", ...ticketOf({ customerId }) },
    select: {
      id: true,
      number: true,
      ticketId: true,
      dueDate: true,
      totalInclVatMinor: true,
      ticket: { select: { reference: true } },
    },
  });
  const paid = await paidForInvoices({ context, invoiceIds: invoices.map((row) => row.id) });
  return invoices
    .map((row) => ({ ...row, openMinor: row.totalInclVatMinor - (paid.get(row.id) ?? 0) }))
    .filter((row) => row.openMinor > 0);
}

export type OpenInvoice = Awaited<ReturnType<typeof loadOpenInvoices>>[number];

/** ACCEPTED quotes on active tickets that have no SENT invoice yet: won, not billed. */
export function loadForwardBooked({ context, customerId }: Db) {
  return context.db.quote.findMany({
    where: {
      quoteStatus: "ACCEPTED",
      ticket: {
        status: "ACTIVE",
        invoices: { none: { status: "SENT" } },
        ...(customerId ? { customerId } : {}),
      },
    },
    select: {
      ticketId: true,
      version: true,
      acceptedAt: true,
      totalExclVatMinor: true,
      lines: { select: { line: { select: { startsAt: true } } } },
    },
  });
}

export type ForwardBookedQuote = Awaited<ReturnType<typeof loadForwardBooked>>[number];
