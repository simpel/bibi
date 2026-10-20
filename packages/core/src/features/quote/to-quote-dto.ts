import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { deriveTicketLines } from "./derive-lines";
import { type QuoteRow, toOrderLineDto, toQuoteDto } from "./quote-view";
import type { QuoteDto } from "./schema";

type Db = { context: Pick<OperationContext, "db" | "permissions"> };

const LINE_ORDER = [{ position: "asc" as const }, { id: "asc" as const }];

/** Prisma `include` for every quote read: its frozen lines in order. */
export const QUOTE_INCLUDE = { lines: { orderBy: LINE_ORDER } };

export type ToQuoteDtosInput = Db & { rows: readonly QuoteRow[] };

/** The previous versions' frozen lines by quote id (one query). */
async function previousLinesOf({ context, rows }: ToQuoteDtosInput) {
  const previousIds = rows.flatMap((row) => (row.previousId ? [row.previousId] : []));
  const found = previousIds.length
    ? await context.db.orderLine.findMany({
        where: { quoteId: { in: previousIds } },
        orderBy: LINE_ORDER,
      })
    : [];
  return ({ id }: { id: string | null }) =>
    id ? found.filter((row) => row.quoteId === id).map((row) => toOrderLineDto({ row })) : null;
}

/**
 * Quotes with their lines marked against each one's previous version; DRAFT and ACCEPTED quotes
 * also read their tickets' priced lines (a fixed number of queries per page), only for a caller
 * who may read the program (ADR 0050, feature scope).
 */
export async function toQuoteDtos({ context, rows }: ToQuoteDtosInput): Promise<QuoteDto[]> {
  const previousOf = await previousLinesOf({ context, rows });
  const ticketIds = [
    ...new Set(
      rows
        .filter((row) => row.quoteStatus === "DRAFT" || row.quoteStatus === "ACCEPTED")
        .map((row) => row.ticketId),
    ),
  ];
  const visible = canView({ context, feature: "program" });
  const live = visible ? await deriveTicketLines({ context, ticketIds }) : null;
  return rows.map((row) =>
    toQuoteDto({
      row,
      previous: previousOf({ id: row.previousId }),
      live: live ? (live.get(row.ticketId) ?? []).map((derived) => derived.line) : null,
    }),
  );
}

export type LoadQuoteInput = Db & { id: string };

/** The active quote, or null when missing, archived or in another organization. */
export async function loadQuote({ context, id }: LoadQuoteInput): Promise<QuoteDto | null> {
  const row = await context.db.quote.findFirst({ where: { id }, include: QUOTE_INCLUDE });
  if (!row) return null;
  const [quote] = await toQuoteDtos({ context, rows: [row] });
  return quote ?? null;
}
