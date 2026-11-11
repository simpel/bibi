import { ok, type Result } from "../../errors/result";
import { changeLineState } from "../../features/line/change-state-operation";
import { createLine } from "../../features/line/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoLine, DemoOrder } from "./order-types";
import { seedDemoAlternatives } from "./seed-alternatives";
import { seedDemoBundleLines } from "./seed-bundle-lines";
import { missing } from "./seed-fields";
import { seedLineAddOns } from "./seed-line-add-ons";
import { seedLineOptions } from "./seed-line-options";

export type SeedLinesInput = {
  context: ExecuteContext;
  orderId: string;
  /** Its `bundles` (ADR 0059), its `lines`, then its `alternatives` (ADR 0052). */
  order: Pick<DemoOrder, "bundles" | "lines" | "alternatives"> & { headcount?: number };
  /** Local time `HH:MM` on the order's day → instant. */
  at: (input: { time: string }) => Date;
};

type OverrideInput = {
  context: ExecuteContext;
  line: DemoLine;
  lineId: string;
  item: { entityTypeId: string };
};

/** The line's state override by name (`line.changeState`), if the data sets one. */
async function overrideState({ context, line, lineId, item }: OverrideInput) {
  if (!line.state) return ok({ value: true });
  const state = await context.db.itemState.findFirst({
    where: { name: line.state, entityTypeId: item.entityTypeId },
  });
  if (!state) return missing({ what: `state ${line.state} of ${line.item}` });
  const input = { lineId, stateId: state.id };
  return execute({ operation: changeLineState, input, context });
}

/**
 * The line's own quantity: the data's, else, when the order has more people than the room may
 * hold (ADR 0103, a hard limit), the room's limit, as a breakout room holds part of the group.
 */
function ownQuantity({
  line,
  headcount,
  maxPeople,
}: {
  line: DemoLine;
  headcount: number | undefined;
  maxPeople: number | null;
}) {
  if (line.quantity !== undefined) return { quantity: line.quantity };
  if (maxPeople !== null && headcount !== undefined && headcount > maxPeople) {
    return { quantity: maxPeople };
  }
  return {};
}

/**
 * The order's lines (ADR 0044) via `line.create` as SYSTEM, in the organization's line
 * type: each starts in the entry status's cell of the status grid (else its type's initial state), so a room
 * line is a soft hold, and a line with `state` is then overridden to it. A line without times is
 * untimed and holds nothing; its own quantity and price are set only when the data gives them.
 * A line's `options` are chosen right after it (ADR 0059, 0082), then its `addOns` added under it
 * (ADR 0088). Lines named in `alternatives` are
 * then grouped (ADR 0052). Bundles are expanded first.
 */
export async function seedDemoLines({
  context,
  orderId,
  order,
  at,
}: SeedLinesInput): Promise<Result<true>> {
  const bundles = await seedDemoBundleLines({ context, orderId, order, at });
  if (!bundles.ok) return bundles;
  const lines = order.lines ?? [];
  if (lines.length === 0) return ok({ value: true });
  const type = await context.db.entityType.findFirst({ where: { base: "LINE" } });
  if (!type) return missing({ what: "a line type (base LINE)" });
  for (const line of lines) {
    const item = await context.db.item.findFirst({ where: { name: line.item } });
    if (!item) return missing({ what: `item ${line.item}` });
    const input = {
      ...{ orderId, entityTypeId: type.id, itemId: item.id, name: line.name },
      ...(line.from && line.to
        ? { startsAt: at({ time: line.from }), endsAt: at({ time: line.to }) }
        : {}),
      ...ownQuantity({ line, headcount: order.headcount, maxPeople: item.maxPeople }),
      ...(line.unitPriceKr === undefined ? {} : { unitPriceMinor: line.unitPriceKr * 100 }),
      ...{ setupMinutes: line.setupMinutes ?? null, teardownMinutes: line.teardownMinutes ?? null },
    };
    const created = await execute({ operation: createLine, input, context });
    if (!created.ok) return created;
    const state = await overrideState({ context, line, lineId: created.value.id, item });
    if (!state.ok) return state;
    const lineId = created.value.id;
    const chosen = await seedLineOptions({ context, lineId, options: line.options });
    if (!chosen.ok) return chosen;
    const added = await seedLineAddOns({ context, orderId, lineId, addOns: line.addOns, at });
    if (!added.ok) return added;
  }
  const alternatives = order.alternatives ?? [];
  return seedDemoAlternatives({ context, orderId, alternatives });
}
