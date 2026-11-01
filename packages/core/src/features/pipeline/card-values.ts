import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { deriveTicketLines } from "../quote/derive-lines";
import { quoteTotals } from "../quote/line-totals";

type Context = Pick<OperationContext, "db" | "permissions">;

export type CardValues = { estimatedValueMinor: number | null; confirmedValueMinor: number | null };

/** Each ticket's newest estimate (ADR 0074), by ticket; cleared estimates are left out. */
async function latestEstimates({ context, ticketIds }: CardValuesInput) {
  const rows = await context.db.ticketEstimate.findMany({
    where: { ticketId: { in: [...ticketIds] } },
    orderBy: { seq: "asc" },
    select: { ticketId: true, valueMinor: true },
  });
  const latest = new Map<string, number | null>();
  for (const row of rows) latest.set(row.ticketId, row.valueMinor);
  return new Map(
    [...latest].flatMap(([id, value]) => (value === null ? [] : [[id, value] as const])),
  );
}

/**
 * What a draft quote of each ticket's priced lines totals excl. VAT (ADR 0052). Lines belong to
 * the program, so without `program:read` there is none (ADR 0071).
 */
async function linesTotals({ context, ticketIds }: CardValuesInput) {
  if (ticketIds.length === 0 || !canView({ context, feature: "program" })) return null;
  const derived = await deriveTicketLines({ context, ticketIds });
  return new Map(
    [...derived].map(([id, lines]) => [
      id,
      quoteTotals({ lines: lines.map(({ line }) => line) }).totalExclVatMinor,
    ]),
  );
}

/** The total excl. VAT of each ticket's newest accepted quote; none without `quote:read`. */
async function acceptedTotals({ context, ticketIds }: CardValuesInput) {
  if (!canView({ context, feature: "quote" })) return new Map<string, number>();
  const quotes = await context.db.quote.findMany({
    where: { ticketId: { in: [...ticketIds] }, quoteStatus: "ACCEPTED" },
    orderBy: [{ acceptedAt: "asc" }, { version: "asc" }],
    select: { ticketId: true, totalExclVatMinor: true },
  });
  return new Map(quotes.map((quote) => [quote.ticketId, quote.totalExclVatMinor]));
}

export type CardValuesInput = { context: Context; ticketIds: readonly string[] };

/**
 * Each ticket's estimated value (its own estimate, else its priced lines' total) and confirmed
 * value (the accepted quote's total), both excl. VAT (ADR 0074). Null where none is known.
 */
export async function cardValues({ context, ticketIds }: CardValuesInput) {
  const estimates = await latestEstimates({ context, ticketIds });
  const unestimated = ticketIds.filter((id) => !estimates.has(id));
  const [lines, accepted] = await Promise.all([
    linesTotals({ context, ticketIds: unestimated }),
    acceptedTotals({ context, ticketIds }),
  ]);
  return ({ ticketId }: { ticketId: string }): CardValues => ({
    estimatedValueMinor: estimates.get(ticketId) ?? lines?.get(ticketId) ?? null,
    confirmedValueMinor: accepted.get(ticketId) ?? null,
  });
}
