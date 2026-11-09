import type { CreditNote, Invoice, InvoiceDeposit, OrderLine } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { paidByReceivable, settlementOf } from "../payment/settlement";
import { toOrderLineDto } from "../quote/quote-view";
import type { InvoiceDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

type DeductionRow = InvoiceDeposit & { deposit: { description: string } };

type CreditRow = Pick<CreditNote, "id" | "number" | "amountMinor" | "status" | "createdAt">;

export type InvoiceRow = Invoice & {
  lines: OrderLine[];
  deductions: DeductionRow[];
  creditNotes: CreditRow[];
};

/** Prisma `include` for every invoice read: its frozen lines, deductions and credit notes. */
export const INVOICE_INCLUDE = {
  lines: { orderBy: [{ position: "asc" as const }, { id: "asc" as const }] },
  deductions: {
    include: { deposit: { select: { description: true } } },
    orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
  },
  creditNotes: {
    select: { id: true, number: true, amountMinor: true, status: true, createdAt: true },
    orderBy: [{ number: "asc" as const }],
  },
};

export type InvoiceDueInput = {
  invoice: Pick<Invoice, "totalInclVatMinor">;
  deductions: readonly Pick<InvoiceDeposit, "amountMinor">[];
  /** Its credit notes that are not FAILED (`DUE_INCLUDE`), ADR 0100. */
  creditNotes: readonly { amountMinor: number }[];
};

/** Prisma `include` for what an invoice's amount due needs: deductions and live credit notes. */
export const DUE_INCLUDE = {
  deductions: { select: { amountMinor: true } },
  creditNotes: { where: { status: { not: "FAILED" as const } }, select: { amountMinor: true } },
};

/**
 * What the invoice asks for (ADR 0090, 0100): its total incl. VAT less the paid deposits it
 * deducts and less what its credit notes credit.
 */
export function invoiceDueMinor({ invoice, deductions, creditNotes }: InvoiceDueInput): number {
  const deducted = deductions.reduce((due, d) => due - d.amountMinor, invoice.totalInclVatMinor);
  return creditNotes.reduce((due, c) => due - c.amountMinor, deducted);
}

export type ToInvoiceDtosInput = Db & { rows: readonly InvoiceRow[] };

/** Invoices with their frozen lines and what is paid against each (one payment query). */
export async function toInvoiceDtos({ context, rows }: ToInvoiceDtosInput): Promise<InvoiceDto[]> {
  const orderIds = [...new Set(rows.map((row) => row.orderId))];
  const paid = await paidByReceivable({ context, orderIds });
  return rows.map(({ lines, deductions, creditNotes, ...row }) => {
    const live = creditNotes.filter((c) => c.status !== "FAILED");
    const amountDueMinor = invoiceDueMinor({ invoice: row, deductions, creditNotes: live });
    return {
      ...row,
      lines: lines.map((line) => toOrderLineDto({ row: line })),
      deductions: deductions.map(({ depositId, amountMinor, deposit }) => ({
        ...{ depositId, amountMinor, description: deposit.description },
      })),
      creditNotes: creditNotes.map(({ id, number, amountMinor, status }) => ({
        ...{ id, number, amountMinor, status },
      })),
      creditedMinor: live.reduce((sum, c) => sum + c.amountMinor, 0),
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
