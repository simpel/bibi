import type { OrderLineDto } from "./order-line-schema";
import type { QuoteLineDto } from "./schema";

/** The line properties a new version is compared on. */
export const COMPARED_LINE_FIELDS = [
  "itemId",
  "name",
  "quantity",
  "unitPriceMinor",
  "priceUnit",
  "discountPercent",
  "vatRatePercent",
] as const;

export type MarkLineChangesInput = {
  lines: readonly OrderLineDto[];
  /** The earlier snapshot's lines; null when there is none (version 1). */
  previous: readonly OrderLineDto[] | null;
};

export type MarkedLines = { lines: QuoteLineDto[]; removedLines: OrderLineDto[] };

/**
 * Change markers against an earlier snapshot (ADR 0022, 0052). Lines are paired by the ticket line
 * they price (`lineId`). Unpaired lines are ADDED; earlier lines left over are removed.
 */
export function markLineChanges({ lines, previous }: MarkLineChangesInput): MarkedLines {
  if (!previous) {
    return {
      lines: lines.map((line) => ({ ...line, change: null, changedFields: [] })),
      removedLines: [],
    };
  }
  const left = [...previous];
  const marked = lines.map((line): QuoteLineDto => {
    const at = left.findIndex((candidate) => candidate.lineId === line.lineId);
    if (at < 0) return { ...line, change: "ADDED", changedFields: [] };
    const [before] = left.splice(at, 1);
    const changedFields = COMPARED_LINE_FIELDS.filter((key) => before?.[key] !== line[key]);
    const change = changedFields.length > 0 ? "CHANGED" : "UNCHANGED";
    return { ...line, change, changedFields };
  });
  return { lines: marked, removedLines: left };
}
