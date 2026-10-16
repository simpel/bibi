import type { OrderLineDto } from "./order-line-schema";
import type { QuoteLineDto } from "./schema";

/** The line properties a new version is compared on. */
export const COMPARED_LINE_FIELDS = [
  "name",
  "quantity",
  "unitPriceMinor",
  "priceUnit",
  "discountPercent",
  "vatRatePercent",
] as const;

export type MarkLineChangesInput = {
  lines: readonly OrderLineDto[];
  /** The previous version's lines; null on version 1. */
  previous: readonly OrderLineDto[] | null;
};

export type MarkedLines = { lines: QuoteLineDto[]; removedLines: OrderLineDto[] };

/**
 * Change markers against the previous version (ADR 0022). Lines are paired by item, in order: the
 * first unpaired previous line of the same item. Unpaired lines are ADDED; previous lines left
 * over are removed.
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
    const at = left.findIndex((candidate) => candidate.itemId === line.itemId);
    if (at < 0) return { ...line, change: "ADDED", changedFields: [] };
    const [before] = left.splice(at, 1);
    const changedFields = COMPARED_LINE_FIELDS.filter((key) => before?.[key] !== line[key]);
    const change = changedFields.length > 0 ? "CHANGED" : "UNCHANGED";
    return { ...line, change, changedFields };
  });
  return { lines: marked, removedLines: left };
}
