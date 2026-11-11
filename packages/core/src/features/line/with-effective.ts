import { ok, type Result } from "../../errors/result";
import { loadHoursWarnings } from "../../hours/hours-warnings";
import type { HandlerInput, OperationContext } from "../../operations/types";
import { effectiveBuffers } from "../../shared/buffers";
import { loadZoneOfVenue } from "../../shared/time-zones";
import { loadLayoutFacts } from "../floor-plan/layout-seats";
import { loadPriceTerms } from "../price-list/customer-price-terms";
import { effectiveOf } from "./effective-values";
import { loadLineWarnings } from "./line-warnings";
import { loadOptionParents, loadSplitSums, splitWarnings } from "./option-split";
import { loadOpenRequiredGroups } from "./required-groups";
import type { LineDto, LineRecord } from "./schema";

type Db = { context: Pick<OperationContext, "db" | "permissions"> };

export type WithEffectiveInput = Db & { lines: readonly LineRecord[] };

/** The layouts the lines book, by id (archived ones included, ADR 0103). */
const loadLayouts = ({ context, lines }: WithEffectiveInput) =>
  loadLayoutFacts({
    context,
    ids: [...new Set(lines.flatMap((line) => (line.layoutId ? [line.layoutId] : [])))],
    archived: true,
  });

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
  const orderIds = [...new Set(lines.map((line) => line.orderId))];
  const [orders, items, layouts] = await Promise.all([
    context.db.order.findMany({
      where: { id: { in: orderIds } },
      select: {
        ...{ id: true, customerId: true, desiredStartsAt: true },
        ...{ estimatedHeadcount: true, guaranteedHeadcount: true },
      },
    }),
    loadItems({ context, lines }),
    loadLayouts({ context, lines }),
  ]);
  const terms = await loadPriceTerms({
    context,
    customerIds: orders.map((order) => order.customerId),
  });
  return {
    orders: new Map(orders.map((order) => [order.id, order])),
    ...items,
    layouts,
    terms,
  };
}

const NO_HEADCOUNT = { estimatedHeadcount: null, guaranteedHeadcount: null };

/**
 * The lines with their effective quantity, price, discount and VAT (ADR 0052) and warnings (ADR
 * 0059, 0082, 0089), from the order's headcount (an option line: its parent's quantity), the
 * customer's price list on the line's day (else the desired start, else today), the item and its
 * venue. A fixed number of queries for any number of lines.
 */
export async function withEffective({ context, lines }: WithEffectiveInput): Promise<LineDto[]> {
  if (lines.length === 0) return [];
  const [sources, warnings, outsideHours, parents, splitSums, openGroups] = await Promise.all([
    loadSources({ context, lines }),
    loadLineWarnings({ context, lineIds: lines.map((line) => line.id) }),
    loadHoursWarnings({ context, lines }),
    loadOptionParents({ context, lines }),
    loadSplitSums({ context, lines }),
    loadOpenRequiredGroups({ context, lines }),
  ]);
  const { orders, items, layouts, terms, organizationZone } = sources;
  return lines.map((line) => {
    const order = orders.get(line.orderId);
    const item = line.itemId ? (items.get(line.itemId) ?? null) : null;
    const on = line.startsAt ?? order?.desiredStartsAt ?? new Date();
    const priceTerms = order ? terms({ customerId: order.customerId, on }) : null;
    const headcount = order ?? NO_HEADCOUNT;
    const layout = line.layoutId ? (layouts.get(line.layoutId) ?? null) : null;
    const type = item?.entityType ?? null;
    const buffers = effectiveBuffers({ line, layout, item, type });
    const outside = outsideHours.get(line.id);
    const parent = parents.get(line.id) ?? null;
    const effective = effectiveOf({ line, order: headcount, parent, item, terms: priceTerms });
    const expected = effective.effectiveQuantity;
    const split = splitWarnings({ sums: splitSums.get(line.id), expected });
    const own = [...(warnings.get(line.id) ?? []), ...(outside ? [outside] : [])];
    return {
      ...line,
      ...effective,
      ...buffers,
      warnings: [...own, ...split, ...(openGroups.get(line.id) ?? [])],
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
