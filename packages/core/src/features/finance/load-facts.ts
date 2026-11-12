import type { OperationContext } from "../../operations/types";
import { DUE_INCLUDE, invoiceDueMinor } from "../invoice/to-invoice-dto";
import { paidForInvoices } from "../payment/settlement";
import type { FinancePeriod } from "./period";

type Scope = { customerId?: string | undefined };
type Db = { context: Pick<OperationContext, "db"> } & Scope;

export type FactsInput = Db & { period: Pick<FinancePeriod, "start" | "end"> };

/** The order filter that narrows a fact to one customer; empty for the whole organization. */
const orderOf = ({ customerId }: Scope) => (customerId ? { order: { customerId } } : {});

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
      ...orderOf({ customerId }),
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
        ...orderOf({ customerId }),
      },
      select: { paidAt: true, amountMinor: true },
    }),
    context.db.paymentRefund.findMany({
      where: { status: "SUCCEEDED", refundedAt: when, payment: orderOf({ customerId }) },
      select: { refundedAt: true, amountMinor: true },
    }),
  ]);
  return { payments, refunds };
}

export type CashInPeriod = Awaited<ReturnType<typeof loadCashInPeriod>>;

/** Every SENT invoice with what is still open on it, today. */
export async function loadOpenInvoices({ context, customerId }: Db) {
  const invoices = await context.db.invoice.findMany({
    where: { status: "SENT", ...orderOf({ customerId }) },
    select: {
      id: true,
      number: true,
      providerReference: true,
      orderId: true,
      dueDate: true,
      totalInclVatMinor: true,
      ...DUE_INCLUDE,
      order: { select: { reference: true, title: true } },
    },
  });
  const paid = await paidForInvoices({ context, invoiceIds: invoices.map((row) => row.id) });
  return invoices
    .map(({ deductions, creditNotes, ...row }) => {
      const due = invoiceDueMinor({ invoice: row, deductions, creditNotes });
      return { ...row, openMinor: due - (paid.get(row.id) ?? 0) };
    })
    .filter((row) => row.openMinor > 0);
}

export type OpenInvoice = Awaited<ReturnType<typeof loadOpenInvoices>>[number];
