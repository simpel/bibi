import type { OperationContext } from "../../operations/types";
import { resolveItemTags } from "../item/resolve-item";
import type { LineDto } from "../line/schema";
import { LINE_INCLUDE, toLineRecord } from "../line/to-line-record";
import { withEffective } from "../line/with-effective";
import { applyAlternatives } from "./alternatives";
import { applyBundles } from "./bundle-lines";
import { lineAmounts } from "./line-totals";
import type { OrderLineDto, OrderLineTag } from "./order-line-schema";

type Db = { context: Pick<OperationContext, "db"> };

/** An effective value a priced line needs before the quote can be sent. */
export type MissingValue = "quantity" | "vatRatePercent";

/** A priced ticket line as an order line, with the values it still lacks to be sent. */
export type DerivedLine = { line: OrderLineDto; missing: MissingValue[] };

/** Timed lines in time order, then untimed ones (fees) in the order they were added. */
const LINE_ORDER = [
  { startsAt: "asc" as const },
  { createdAt: "asc" as const },
  { id: "asc" as const },
];

type Facts = { priceUnit: OrderLineDto["priceUnit"]; tags: OrderLineTag[] };

/** Each item's price unit and contained tags (`item.resolve`), once per distinct item. */
async function itemFacts({ context, itemIds }: Db & { itemIds: string[] }) {
  const items = await context.db.item.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, priceUnit: true },
  });
  const facts = new Map<string, Facts>();
  for (const { id, priceUnit } of items) {
    const resolution = await resolveItemTags({ context, id });
    const tags = (resolution?.contains ?? []).map(({ valueId, vocabularyId, name }) => ({
      ...{ valueId, vocabularyId, name },
    }));
    facts.set(id, { priceUnit, tags });
  }
  return facts;
}

type ToDerivedInput = { line: LineDto; unitPriceMinor: number; position: number; facts?: Facts };

function toDerived({ line, unitPriceMinor, position, facts }: ToDerivedInput): DerivedLine {
  const quantity = line.effectiveQuantity ?? 0;
  const vatRatePercent = line.effectiveVatRatePercent ?? 0;
  const discountPercent = line.effectiveDiscountPercent;
  const amounts = lineAmounts({ quantity, unitPriceMinor, discountPercent, vatRatePercent });
  const missing: MissingValue[] = [
    ...(line.effectiveQuantity === null ? (["quantity"] as const) : []),
    ...(line.effectiveVatRatePercent === null ? (["vatRatePercent"] as const) : []),
  ];
  const order = {
    ...{ id: line.id, lineId: line.id, itemId: line.itemId, position, name: line.name },
    ...{ quantity, unitPriceMinor, priceUnit: facts?.priceUnit ?? null, discountPercent },
    ...{ vatRatePercent, tags: facts?.tags ?? [], ...amounts },
    vatRows: [{ vatRatePercent, ...amounts }],
    parentLineId: line.parentLineId,
    ...{ alternativeGroupId: line.alternativeGroupId, alternativeGroupName: null },
    ...{ alternativeGroupChosen: null, inTotal: true },
  };
  return { line: order, missing };
}

export type DeriveTicketLinesInput = Db & { ticketIds: readonly string[] };

/**
 * The tickets' priced lines as order lines (ADR 0052): every active line with an effective unit
 * price, at its effective quantity, discount and VAT, with the item's price unit and tags. What a
 * DRAFT quote shows and what `quote.send` freezes, with their alternative groups and a bundle
 * line's VAT per rate of its parts (ADR 0059). Keyed by ticket.
 */
export async function deriveTicketLines({
  context,
  ticketIds,
}: DeriveTicketLinesInput): Promise<Map<string, DerivedLine[]>> {
  const out = new Map<string, DerivedLine[]>(ticketIds.map((id) => [id, []]));
  if (ticketIds.length === 0) return out;
  const rows = await context.db.line.findMany({
    where: { ticketId: { in: [...ticketIds] } },
    orderBy: LINE_ORDER,
    include: LINE_INCLUDE,
  });
  const lines = await withEffective({ context, lines: rows.map((row) => toLineRecord({ row })) });
  const priced = lines.filter((line) => line.effectiveUnitPriceMinor !== null);
  const itemIds = [...new Set(priced.flatMap((line) => (line.itemId ? [line.itemId] : [])))];
  const facts = await itemFacts({ context, itemIds });
  for (const line of priced) {
    const list = out.get(line.ticketId) ?? [];
    const unitPriceMinor = line.effectiveUnitPriceMinor ?? 0;
    const known = line.itemId ? facts.get(line.itemId) : undefined;
    list.push(toDerived({ line, unitPriceMinor, position: list.length, facts: known }));
    out.set(line.ticketId, list);
  }
  const derived = [...out.values()].flat();
  await applyAlternatives({ context, lines: derived });
  applyBundles({ derived, lines });
  return out;
}
