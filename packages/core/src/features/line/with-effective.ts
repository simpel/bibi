import { ok, type Result } from "../../errors/result";
import type { HandlerInput, OperationContext } from "../../operations/types";
import { loadPriceTerms } from "../price-list/customer-price-terms";
import { effectiveOf } from "./effective-values";
import type { LineDto, LineRecord } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

export type WithEffectiveInput = Db & { lines: readonly LineRecord[] };

async function loadSources({ context, lines }: WithEffectiveInput) {
  const ticketIds = [...new Set(lines.map((line) => line.ticketId))];
  const itemIds = [...new Set(lines.flatMap((line) => (line.itemId ? [line.itemId] : [])))];
  const [tickets, items] = await Promise.all([
    context.db.ticket.findMany({
      where: { id: { in: ticketIds } },
      select: {
        ...{ id: true, customerId: true, desiredStartsAt: true },
        ...{ estimatedHeadcount: true, guaranteedHeadcount: true },
      },
    }),
    context.db.item.findMany({
      where: { id: { in: itemIds } },
      select: {
        ...{ id: true, priceMinor: true, vatRatePercent: true },
        venue: { select: { defaultVatRatePercent: true } },
      },
    }),
  ]);
  const terms = await loadPriceTerms({
    context,
    customerIds: tickets.map((ticket) => ticket.customerId),
  });
  return {
    tickets: new Map(tickets.map((ticket) => [ticket.id, ticket])),
    items: new Map(
      items.map(({ venue, ...item }) => [
        item.id,
        { ...item, venueVatRatePercent: venue?.defaultVatRatePercent ?? null },
      ]),
    ),
    terms,
  };
}

const NO_HEADCOUNT = { estimatedHeadcount: null, guaranteedHeadcount: null };

/**
 * The lines with their effective quantity, price, discount and VAT (ADR 0052), derived from the
 * ticket's headcount, the customer's price list valid on the line's day (else the ticket's desired
 * start, else today), the item and its venue. A fixed number of queries for any number of lines.
 */
export async function withEffective({ context, lines }: WithEffectiveInput): Promise<LineDto[]> {
  if (lines.length === 0) return [];
  const { tickets, items, terms } = await loadSources({ context, lines });
  return lines.map((line) => {
    const ticket = tickets.get(line.ticketId);
    const item = line.itemId ? (items.get(line.itemId) ?? null) : null;
    const on = line.startsAt ?? ticket?.desiredStartsAt ?? new Date();
    const priceTerms = ticket ? terms({ customerId: ticket.customerId, on }) : null;
    const headcount = ticket ?? NO_HEADCOUNT;
    return { ...line, ...effectiveOf({ line, ticket: headcount, item, terms: priceTerms }) };
  });
}

export type WithEffectiveOneInput = Db & { line: LineRecord };

/** One line with its effective values. */
export async function withEffectiveOne({ context, line }: WithEffectiveOneInput): Promise<LineDto> {
  const [out] = await withEffective({ context, lines: [line] });
  return out as LineDto;
}

type Handler<I, T> = (args: HandlerInput<I>) => Promise<Result<T>>;

export type EffectiveHandlerInput<I> = { handler: Handler<I, LineRecord> };

/** Wraps a line command's handler so its output carries the effective values. */
export function effectiveHandler<I>({ handler }: EffectiveHandlerInput<I>): Handler<I, LineDto> {
  return async (args) => {
    const result = await handler(args);
    if (!result.ok) return result;
    return ok({ value: await withEffectiveOne({ context: args.context, line: result.value }) });
  };
}
