import type { OrderLine, Quote } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { markLineChanges } from "./line-changes";
import type { OrderLineDto, OrderLineTag } from "./order-line-schema";
import type { QuoteDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

const LINE_ORDER = [{ position: "asc" as const }, { id: "asc" as const }];

/** Prisma `include` for every quote read: its lines in order. */
export const QUOTE_INCLUDE = { lines: { orderBy: LINE_ORDER } };

export type QuoteRow = Quote & { lines: OrderLine[] };

const asTags = ({ value }: { value: unknown }): OrderLineTag[] =>
  Array.isArray(value) ? (value as OrderLineTag[]) : [];

export const toOrderLineDto = ({ row }: { row: OrderLine }): OrderLineDto => ({
  id: row.id,
  itemId: row.itemId,
  position: row.position,
  name: row.name,
  quantity: row.quantity,
  unitPriceMinor: row.unitPriceMinor,
  priceUnit: row.priceUnit,
  discountPercent: row.discountPercent,
  vatRatePercent: row.vatRatePercent,
  tags: asTags({ value: row.tags }),
  totalExclVatMinor: row.totalExclVatMinor,
  vatMinor: row.vatMinor,
});

export type ToQuoteDtosInput = Db & { rows: readonly QuoteRow[] };

/** Quotes with their lines marked against each one's previous version (one extra query). */
export async function toQuoteDtos({ context, rows }: ToQuoteDtosInput): Promise<QuoteDto[]> {
  const previousIds = rows.flatMap((row) => (row.previousId ? [row.previousId] : []));
  const previousLines = previousIds.length
    ? await context.db.orderLine.findMany({
        where: { quoteId: { in: previousIds } },
        orderBy: LINE_ORDER,
      })
    : [];
  return rows.map(({ lines, ...quote }) => {
    const previous = quote.previousId
      ? previousLines
          .filter((line) => line.quoteId === quote.previousId)
          .map((row) => toOrderLineDto({ row }))
      : null;
    const current = lines.map((row) => toOrderLineDto({ row }));
    return { ...quote, ...markLineChanges({ lines: current, previous }) };
  });
}

export type LoadQuoteInput = Db & { id: string };

/** The active quote, or null when missing, archived or in another organization. */
export async function loadQuote({ context, id }: LoadQuoteInput): Promise<QuoteDto | null> {
  const row = await context.db.quote.findFirst({ where: { id }, include: QUOTE_INCLUDE });
  if (!row) return null;
  const [quote] = await toQuoteDtos({ context, rows: [row] });
  return quote ?? null;
}
