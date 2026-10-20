import type { OrderLine, Quote } from "@okazi/db";
import { markLineChanges } from "./line-changes";
import { quoteTotals, totalIsFrom } from "./line-totals";
import type { OrderLineDto, OrderLineTag } from "./order-line-schema";
import type { QuoteDto, QuoteLineDto } from "./schema";

export type QuoteRow = Quote & { lines: OrderLine[] };

const asTags = ({ value }: { value: unknown }): OrderLineTag[] =>
  Array.isArray(value) ? (value as OrderLineTag[]) : [];

export const toOrderLineDto = ({ row }: { row: OrderLine }): OrderLineDto => ({
  id: row.id,
  lineId: row.lineId,
  itemId: row.itemId,
  position: row.position,
  name: row.name,
  quantity: row.quantity,
  unitPriceMinor: row.unitPriceMinor,
  priceUnit: row.priceUnit,
  discountPercent: row.discountPercent.toNumber(),
  vatRatePercent: row.vatRatePercent,
  tags: asTags({ value: row.tags }),
  totalExclVatMinor: row.totalExclVatMinor,
  vatMinor: row.vatMinor,
  alternativeGroupId: row.alternativeGroupId,
  alternativeGroupName: row.alternativeGroupName,
  alternativeGroupChosen: row.alternativeGroupChosen,
  inTotal: row.inTotal,
});

type Drift = Pick<QuoteDto, "differsFromTicket" | "ticketChanges" | "ticketRemovedLines">;

const NO_DRIFT: Drift = { differsFromTicket: null, ticketChanges: [], ticketRemovedLines: [] };

type DriftInput = { snapshot: readonly OrderLineDto[]; live: readonly OrderLineDto[] };

/** ADR 0052: the ticket's priced lines now, marked against the accepted snapshot. Never stored. */
function ticketDrift({ snapshot, live }: DriftInput): Drift {
  const { lines, removedLines } = markLineChanges({ lines: live, previous: snapshot });
  const ticketChanges = lines.filter((line: QuoteLineDto) => line.change !== "UNCHANGED");
  const differsFromTicket = ticketChanges.length > 0 || removedLines.length > 0;
  return { differsFromTicket, ticketChanges, ticketRemovedLines: removedLines };
}

export type ToQuoteDtoInput = {
  row: QuoteRow;
  /** The previous version's frozen lines; null on version 1. */
  previous: readonly OrderLineDto[] | null;
  /**
   * The ticket's priced lines now (`deriveTicketLines`); null for a caller without
   * `program:read` (ADR 0050): a DRAFT then shows no lines and an ACCEPTED quote no drift.
   */
  live: readonly OrderLineDto[] | null;
};

/**
 * A DRAFT shows the ticket's lines live with derived totals; a sent quote its frozen snapshot and
 * stored totals. Both are marked against the previous version; an ACCEPTED quote also against
 * the ticket's lines now.
 */
export function toQuoteDto({ row: { lines: rows, ...quote }, previous, live }: ToQuoteDtoInput) {
  const draft = quote.quoteStatus === "DRAFT";
  const own = draft ? [...(live ?? [])] : rows.map((row) => toOrderLineDto({ row }));
  const { totalExclVatMinor, totalInclVatMinor } = draft ? quoteTotals({ lines: own }) : quote;
  const accepted = quote.quoteStatus === "ACCEPTED" && live;
  const drift = accepted ? ticketDrift({ snapshot: own, live }) : NO_DRIFT;
  const marked = markLineChanges({ lines: own, previous });
  const from = totalIsFrom({ lines: own });
  const dto: QuoteDto = {
    ...{ ...quote, totalExclVatMinor, totalInclVatMinor, totalIsFrom: from },
    ...{ ...marked, ...drift },
  };
  return dto;
}
