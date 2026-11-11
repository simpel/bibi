import type { OperationContext } from "../../../operations/types";
import { effectiveBuffers } from "../../../shared/buffers";
import { type LayoutFacts, loadLayoutFacts } from "../../floor-plan/layout-seats";
import type { PlannedLine } from "./planned-line";
import { loadStartStates, type StartState } from "./start-states";

type Db = { context: Pick<OperationContext, "db"> };

const MINUTES = { setupMinutes: true, teardownMinutes: true } as const;

const ITEM_SELECT = {
  ...{ id: true, name: true, entityTypeId: true, priceMinor: true, maxPeople: true, ...MINUTES },
  entityType: { select: { capabilities: true, ...MINUTES } },
} as const;

/** What planning needs of a line's item. */
export type PlanItem = {
  id: string;
  name: string;
  entityTypeId: string;
  priceMinor: number | null;
  bookable: boolean;
  /** The item's people limit (ADR 0103); null = none. */
  maxPeople: number | null;
  setupMinutes: number | null;
  teardownMinutes: number | null;
  type: { setupMinutes: number | null; teardownMinutes: number | null };
};

/** Everything the lines refer to, read once for any number of lines. */
export type PlanSources = {
  items: ReadonlyMap<string, PlanItem>;
  /** The lines' layouts by id (archived ones included): room, buffers and capacity (ADR 0103). */
  layouts: ReadonlyMap<string, LayoutFacts>;
  /** The start state of a line of the item type, or null. */
  stateOf: (input: { entityTypeId: string }) => StartState | null;
};

const unique = ({ ids }: { ids: readonly (string | null | undefined)[] }) => [
  ...new Set(ids.filter((id): id is string => Boolean(id))),
];

export type LoadPlanSourcesInput = Db & { statusId: string; lines: readonly PlannedLine[] };

/** The items, layouts and start states of the lines: a fixed number of queries. */
export async function loadPlanSources({
  context,
  statusId,
  lines,
}: LoadPlanSourcesInput): Promise<PlanSources> {
  const itemIds = unique({ ids: lines.map((line) => line.itemId) });
  const layoutIds = unique({ ids: lines.map((line) => line.layoutId) });
  const [rows, layouts] = await Promise.all([
    context.db.item.findMany({ where: { id: { in: itemIds } }, select: ITEM_SELECT }),
    loadLayoutFacts({ context, ids: layoutIds, archived: true }),
  ]);
  const items = new Map(
    rows.map(({ entityType, ...item }) => [
      item.id,
      { ...item, bookable: entityType.capabilities.includes("BOOKABLE"), type: entityType },
    ]),
  );
  const typeIds = unique({ ids: rows.map((row) => row.entityTypeId) });
  const states = await loadStartStates({ context, statusId, entityTypeIds: typeIds });
  return {
    items,
    layouts,
    stateOf: ({ entityTypeId }) => states.get(entityTypeId) ?? null,
  };
}

export type LineBuffersInput = { line: PlannedLine; sources: PlanSources };

/**
 * The line's effective setup and teardown minutes (ADR 0059, 0103): line → layout → item → type,
 * as the holds trigger derives them.
 */
export function lineBuffers({ line, sources }: LineBuffersInput) {
  const item = line.itemId ? sources.items.get(line.itemId) : undefined;
  const buffers = effectiveBuffers({
    line: {
      setupMinutes: line.setupMinutes ?? null,
      teardownMinutes: line.teardownMinutes ?? null,
    },
    layout: line.layoutId ? (sources.layouts.get(line.layoutId) ?? null) : null,
    item: item ?? null,
    type: item?.type ?? null,
  });
  return { setup: buffers.effectiveSetupMinutes, teardown: buffers.effectiveTeardownMinutes };
}
