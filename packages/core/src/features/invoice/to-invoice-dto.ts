import type { Invoice, InvoiceDeposit, OrderLine } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { paidByReceivable, settlementOf } from "../payment/settlement";
import { toOrderLineDto } from "../quote/quote-view";
import type { InvoiceDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

type DeductionRow = InvoiceDeposit & { deposit: { description: string } };

export type InvoiceRow = Invoice & { lines: OrderLine[]; deductions: DeductionRow[] };

/** Prisma `include` for every invoice read: its frozen lines in order and its deductions. */
export const INVOICE_INCLUDE = {
  lines: { orderBy: [{ position: "asc" as const }, { id: "asc" as const }] },
  deductions: {
    include: { deposit: { select: { description: true } } },
    orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
  },
};

export type InvoiceDueInput = {
  invoice: Pick<Invoice, "totalInclVatMinor">;
  deductions: readonly Pick<InvoiceDeposit, "amountMinor">[];
};

/** What the invoice asks for (ADR 0090): its total incl. VAT less the paid deposits it deducts. */
export function invoiceDueMinor({ invoice, deductions }: InvoiceDueInput): number {
  return deductions.reduce((due, d) => due - d.amountMinor, invoice.totalInclVatMinor);
}

export type ToInvoiceDtosInput = Db & { rows: readonly InvoiceRow[] };

/** Invoices with their frozen lines and what is paid against each (one payment query). */
export async function toInvoiceDtos({ context, rows }: ToInvoiceDtosInput): Promise<InvoiceDto[]> {
  const ticketIds = [...new Set(rows.map((row) => row.ticketId))];
  const paid = await paidByReceivable({ context, ticketIds });
  return rows.map(({ lines, deductions, ...row }) => {
    const amountDueMinor = invoiceDueMinor({ invoice: row, deductions });
    return {
      ...row,
      lines: lines.map((line) => toOrderLineDto({ row: line })),
      deductions: deductions.map(({ depositId, amountMinor, deposit }) => ({
        ...{ depositId, amountMinor, description: deposit.description },
      })),
      amountDueMinor,
      ...settlementOf({ paid, id: row.id, amountMinor: amountDueMinor }),
    };
  });
}

export type LoadInvoiceInput = Db & { id: string };

/** The invoice, or null when missing or in another organization. */
export async function loadInvoice({ context, id }: LoadInvoiceInput): Promise<InvoiceDto | null> {
  const row = await context.db.invoice.findFirst({ where: { id }, include: INVOICE_INCLUDE });
  if (!row) return null;
  const [dto] = await toInvoiceDtos({ context, rows: [row] });
  return dto ?? null;
}
