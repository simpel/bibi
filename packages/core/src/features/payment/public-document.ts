import type { OrderLine } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { nestUnderParents } from "../line/nest-lines";
import { totalIsFrom } from "../quote/line-totals";
import type { PublicPaymentLine, PublicPaymentTotals } from "./public-document-schema";

type Context = Pick<OperationContext, "db" | "permissions">;

export type PublicDocument = { lines: PublicPaymentLine[]; totals: PublicPaymentTotals | null };

const NONE: PublicDocument = { lines: [], totals: null };

const LINE_ORDER = [{ position: "asc" as const }, { id: "asc" as const }];

type Stored = { totalExclVatMinor: number; totalInclVatMinor: number };

type Deduction = PublicPaymentTotals["deductions"][number];

type ToDocumentInput = { rows: OrderLine[]; stored: Stored; deductions?: Deduction[] };

/** The frozen lines nested under their parents, stripped to what the document showed. */
function toDocument({ rows, stored, deductions = [] }: ToDocumentInput): PublicDocument {
  const present = new Set(rows.map((row) => row.lineId));
  const nested = nestUnderParents({
    rows,
    keys: (row) => ({ id: row.lineId, parentId: row.parentLineId }),
  });
  const lines = nested.map((row) => ({
    ...{ name: row.name, quantity: row.quantity, unitPriceMinor: row.unitPriceMinor },
    ...{ discountPercent: row.discountPercent.toNumber(), vatRatePercent: row.vatRatePercent },
    ...{ totalExclVatMinor: row.totalExclVatMinor, role: row.role, inTotal: row.inTotal },
    subLine: row.parentLineId !== null && present.has(row.parentLineId),
  }));
  const { totalExclVatMinor, totalInclVatMinor } = stored;
  const vatMinor = totalInclVatMinor - totalExclVatMinor;
  const from = totalIsFrom({ lines: rows });
  const amountDueMinor = deductions.reduce((due, d) => due - d.amountMinor, totalInclVatMinor);
  const totals = { totalExclVatMinor, vatMinor, totalInclVatMinor, totalIsFrom: from };
  return { lines, totals: { ...totals, deductions, amountDueMinor } };
}

export type PublicDocumentInput = {
  context: Context;
  payment: { quoteId: string | null; invoiceId: string | null };
};

/**
 * The quote or invoice a public payment settles, read only from its snapshot (ADR 0052): what
 * the customer already received on that document. A deposit, or a document no longer found,
 * gives no lines. The quote is another feature's record (ADR 0071), shown only when the pinned
 * context may read quotes.
 */
export async function publicDocument({
  context,
  payment,
}: PublicDocumentInput): Promise<PublicDocument> {
  if (payment.invoiceId) {
    const invoice = await context.db.invoice.findFirst({
      where: { id: payment.invoiceId },
      include: {
        lines: { orderBy: LINE_ORDER },
        deductions: { include: { deposit: { select: { description: true } } } },
      },
    });
    if (!invoice) return NONE;
    const deductions = invoice.deductions.map(({ amountMinor, deposit }) => ({
      ...{ amountMinor, description: deposit.description },
    }));
    return toDocument({ rows: invoice.lines, stored: invoice, deductions });
  }
  if (!payment.quoteId || !canView({ context, feature: "quote" })) return NONE;
  const quote = await context.db.quote.findFirst({
    where: { id: payment.quoteId, quoteStatus: { not: "DRAFT" } },
    include: { lines: { orderBy: LINE_ORDER } },
  });
  return quote ? toDocument({ rows: quote.lines, stored: quote }) : NONE;
}
