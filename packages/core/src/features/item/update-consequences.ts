import type { Consequence } from "../../change-preview/schema";
import type { HandlerInput } from "../../operations/types";
import { canView } from "../../shared/can-view";
import type { ItemUpdateInput } from "./schema";

/**
 * What changing an item affects beyond the item (ADR 0049): quote lines are snapshots, so a new
 * price only applies to lines added later. Read before the change; nothing is written.
 */
export async function itemUpdateConsequences({
  input,
  context,
}: HandlerInput<ItemUpdateInput>): Promise<Consequence[]> {
  if (input.priceMinor === undefined && input.priceUnit === undefined) return [];
  // Quote lines belong to quotes: only counted for a caller who may view them (ADR 0050).
  if (!canView({ context, feature: "quote" })) return [];
  const lines = await context.db.orderLine.findMany({
    where: { itemId: input.id },
    select: { quoteId: true },
  });
  if (lines.length === 0) return [];
  const quotes = new Set(lines.map((line) => line.quoteId)).size;
  return [{ key: "priceKeptOnQuotes", values: { lines: lines.length, quotes }, severity: "info" }];
}
