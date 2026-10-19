import type { Invoice, OrderLine } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { paidByReceivable, settlementOf } from "../payment/settlement";
import { toOrderLineDto } from "../quote/quote-view";
import type { InvoiceDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

export type InvoiceRow = Invoice & { lines: OrderLine[] };

/** Prisma `include` for every invoice read: its frozen lines in order. */
export const INVOICE_INCLUDE = {
  lines: { orderBy: [{ position: "asc" as const }, { id: "asc" as const }] },
};

export type ToInvoiceDtosInput = Db & { rows: readonly InvoiceRow[] };

/** Invoices with their frozen lines and what is paid against each (one payment query). */
export async function toInvoiceDtos({ context, rows }: ToInvoiceDtosInput): Promise<InvoiceDto[]> {
  const ticketIds = [...new Set(rows.map((row) => row.ticketId))];
  const paid = await paidByReceivable({ context, ticketIds });
  return rows.map(({ lines, ...row }) => ({
    ...row,
    lines: lines.map((line) => toOrderLineDto({ row: line })),
    ...settlementOf({ paid, id: row.id, amountMinor: row.totalInclVatMinor }),
  }));
}

export type LoadInvoiceInput = Db & { id: string };

/** The invoice, or null when missing or in another organization. */
export async function loadInvoice({ context, id }: LoadInvoiceInput): Promise<InvoiceDto | null> {
  const row = await context.db.invoice.findFirst({ where: { id }, include: INVOICE_INCLUDE });
  if (!row) return null;
  const [dto] = await toInvoiceDtos({ context, rows: [row] });
  return dto ?? null;
}
