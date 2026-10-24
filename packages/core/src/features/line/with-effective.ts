import { ok, type Result } from "../../errors/result";
import type { HandlerInput, OperationContext } from "../../operations/types";
import { effectiveBuffers } from "../../shared/buffers";
import { loadZoneOfVenue } from "../../shared/time-zones";
import { loadPriceTerms } from "../price-list/customer-price-terms";
import { effectiveOf } from "./effective-values";
import { loadLineWarnings } from "./line-warnings";
import type { LineDto, LineRecord } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

export type WithEffectiveInput = Db & { lines: readonly LineRecord[] };

/** The changeover time of each setup the lines use, by setup id (archived ones included). */
async function loadChangeovers({ context, lines }: WithEffectiveInput) {
  const setupIds = [...new Set(lines.flatMap((line) => (line.setupId ? [line.setupId] : [])))];
  if (setupIds.length === 0) return new Map<string, number>();
  const setups = await context.db.setup.findMany({
    where: { id: { in: setupIds }, status: { in: ["ACTIVE", "ARCHIVED"] } },
    select: { id: true, changeoverMinutes: true },
  });
  return new Map(setups.map((setup) => [setup.id, setup.changeoverMinutes]));
}

/** The lines' items with their venue's VAT default and their zone (ADR 0064), by id. */
async function loadItems({ context, lines }: WithEffectiveInput) {
  const itemIds = [...new Set(lines.flatMap((line) => (line.itemId ? [line.itemId] : [])))];
  const [items, zoneOf] = await Promise.all([
    context.db.item.findMany({
      where: { id: { in: itemIds } },
      select: {
        ...{ id: true, priceMinor: true, vatRatePercent: true },
        ...{ setupMinutes: true, teardownMinutes: true },
        venue: { select: { defaultVatRatePercent: true, timeZone: true } },
        entityType: { select: { setupMinutes: true, teardownMinutes: true } },
      },
    }),
    loadZoneOfVenue({ context }),
  ]);
  const byId = new Map(
    items.map(({ venue, ...item }) => [
      item.id,
      {
        ...item,
        venueVatRatePercent: venue?.defaultVatRatePercent ?? null,
        timeZone: zoneOf({ venue }),
      },
    ]),
  );
  // A line without an item has the organization's zone.
  return { items: byId, organizationZone: zoneOf({ venue: null }) };
}

async function loadSources({ context, lines }: WithEffectiveInput) {
  const ticketIds = [...new Set(lines.map((line) => line.ticketId))];
  const [tickets, items, changeovers] = await Promise.all([
    context.db.ticket.findMany({
      where: { id: { in: ticketIds } },
      select: {
        ...{ id: true, customerId: true, desiredStartsAt: true },
        ...{ estimatedHeadcount: true, guaranteedHeadcount: true },
      },
    }),
    loadItems({ context, lines }),
    loadChangeovers({ context, lines }),
  ]);
  const terms = await loadPriceTerms({
    context,
    customerIds: tickets.map((ticket) => ticket.customerId),
  });
  return {
    tickets: new Map(tickets.map((ticket) => [ticket.id, ticket])),
    ...items,
    changeovers,
    terms,
  };
}

const NO_HEADCOUNT = { estimatedHeadcount: null, guaranteedHeadcount: null };

/**
 * The lines with their effective quantity, price, discount and VAT (ADR 0052) and warnings (ADR 0059), derived from the
 * ticket's headcount, the customer's price list valid on the line's day (else the ticket's desired
 * start, else today), the item and its venue. A fixed number of queries for any number of lines.
 */
export async function withEffective({ context, lines }: WithEffectiveInput): Promise<LineDto[]> {
  if (lines.length === 0) return [];
  const [{ tickets, items, changeovers, terms, organizationZone }, warnings] = await Promise.all([
    loadSources({ context, lines }),
    loadLineWarnings({ context, lineIds: lines.map((line) => line.id) }),
  ]);
  return lines.map((line) => {
    const ticket = tickets.get(line.ticketId);
    const item = line.itemId ? (items.get(line.itemId) ?? null) : null;
    const on = line.startsAt ?? ticket?.desiredStartsAt ?? new Date();
    const priceTerms = ticket ? terms({ customerId: ticket.customerId, on }) : null;
    const headcount = ticket ?? NO_HEADCOUNT;
    const changeoverMinutes = line.setupId ? (changeovers.get(line.setupId) ?? null) : null;
    const buffers = effectiveBuffers({
      line,
      item,
      type: item?.entityType ?? null,
      changeoverMinutes,
    });
    return {
      ...line,
      ...effectiveOf({ line, ticket: headcount, item, terms: priceTerms }),
      ...buffers,
      warnings: warnings.get(line.id) ?? [],
      timeZone: item?.timeZone ?? organizationZone,
    };
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
