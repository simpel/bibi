import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { deriveOrderLines } from "../quote/derive-lines";
import { quoteTotals } from "../quote/line-totals";

type Context = Pick<OperationContext, "db" | "permissions">;

export type CardValues = { estimatedValueMinor: number | null; confirmedValueMinor: number | null };

/** Each order's newest estimate (ADR 0074), by order; cleared estimates are left out. */
async function latestEstimates({ context, orderIds }: CardValuesInput) {
  const rows = await context.db.orderEstimate.findMany({
    where: { orderId: { in: [...orderIds] } },
    orderBy: { seq: "asc" },
    select: { orderId: true, valueMinor: true },
  });
  const latest = new Map<string, number | null>();
  for (const row of rows) latest.set(row.orderId, row.valueMinor);
  return new Map(
    [...latest].flatMap(([id, value]) => (value === null ? [] : [[id, value] as const])),
  );
}

/**
 * What a draft quote of each order's priced lines totals excl. VAT (ADR 0052). Lines belong to
 * the program, so without `program:read` there is none (ADR 0071).
 */
async function linesTotals({ context, orderIds }: CardValuesInput) {
  if (orderIds.length === 0 || !canView({ context, feature: "program" })) return null;
  const derived = await deriveOrderLines({ context, orderIds });
  return new Map(
    [...derived].map(([id, lines]) => [
      id,
      quoteTotals({ lines: lines.map(({ line }) => line) }).totalExclVatMinor,
    ]),
  );
}

/** The total excl. VAT of each order's newest accepted quote; none without `quote:read`. */
async function acceptedTotals({ context, orderIds }: CardValuesInput) {
  if (!canView({ context, feature: "quote" })) return new Map<string, number>();
  const quotes = await context.db.quote.findMany({
    where: { orderId: { in: [...orderIds] }, quoteStatus: "ACCEPTED" },
    orderBy: [{ acceptedAt: "asc" }, { version: "asc" }],
    select: { orderId: true, totalExclVatMinor: true },
  });
  return new Map(quotes.map((quote) => [quote.orderId, quote.totalExclVatMinor]));
}

export type CardValuesInput = { context: Context; orderIds: readonly string[] };

/**
 * Each order's estimated value (its own estimate, else its priced lines' total) and confirmed
 * value (the accepted quote's total), both excl. VAT (ADR 0074). Null where none is known.
 */
export async function cardValues({ context, orderIds }: CardValuesInput) {
  const estimates = await latestEstimates({ context, orderIds });
  const unestimated = orderIds.filter((id) => !estimates.has(id));
  const [lines, accepted] = await Promise.all([
    linesTotals({ context, orderIds: unestimated }),
    acceptedTotals({ context, orderIds }),
  ]);
  return ({ orderId }: { orderId: string }): CardValues => ({
    estimatedValueMinor: estimates.get(orderId) ?? lines?.get(orderId) ?? null,
    confirmedValueMinor: accepted.get(orderId) ?? null,
  });
}
