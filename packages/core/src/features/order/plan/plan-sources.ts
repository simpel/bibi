import type { OperationContext } from "../../../operations/types";
import { effectiveBuffers } from "../../../shared/buffers";
import { effectiveCapacity, layoutKey, loadLayoutSeats } from "../../floor-plan/layout-seats";
import type { PlannedLine } from "./planned-line";
import { loadStartStates, type StartState } from "./start-states";

type Db = { context: Pick<OperationContext, "db"> };

const MINUTES = { setupMinutes: true, teardownMinutes: true } as const;

const ITEM_SELECT = {
  ...{ id: true, name: true, entityTypeId: true, priceMinor: true, ...MINUTES },
  entityType: { select: { capabilities: true, ...MINUTES } },
} as const;

/** What planning needs of a line's item. */
export type PlanItem = {
  id: string;
  name: string;
  entityTypeId: string;
  priceMinor: number | null;
  bookable: boolean;
  setupMinutes: number | null;
  teardownMinutes: number | null;
  type: { setupMinutes: number | null; teardownMinutes: number | null };
};

/** Everything the lines refer to, read once for any number of lines. */
export type PlanSources = {
  items: ReadonlyMap<string, PlanItem>;
  /** Setup id → changeover minutes. */
  changeovers: ReadonlyMap<string, number | null>;
  /** `<itemId> <setupId>` → the item's capacity in that setup. */
  capacities: ReadonlyMap<string, number>;
  /** The start state of a line of the item type, or null. */
  stateOf: (input: { entityTypeId: string }) => StartState | null;
};

const unique = ({ ids }: { ids: readonly (string | null | undefined)[] }) => [
  ...new Set(ids.filter((id): id is string => Boolean(id))),
];

export type LoadPlanSourcesInput = Db & { statusId: string; lines: readonly PlannedLine[] };

/** The items, setups, capacities and start states of the lines: a fixed number of queries. */
export async function loadPlanSources({
  context,
  statusId,
  lines,
}: LoadPlanSourcesInput): Promise<PlanSources> {
  const itemIds = unique({ ids: lines.map((line) => line.itemId) });
  const setupIds = unique({ ids: lines.map((line) => line.setupId) });
  const [rows, setups, itemSetups] = await Promise.all([
    context.db.item.findMany({ where: { id: { in: itemIds } }, select: ITEM_SELECT }),
    context.db.setup.findMany({
      where: { id: { in: setupIds } },
      select: { id: true, changeoverMinutes: true },
    }),
    context.db.itemSetup.findMany({
      where: { itemId: { in: itemIds }, setupId: { in: setupIds } },
      select: { itemId: true, setupId: true, capacity: true },
    }),
  ]);
  const items = new Map(
    rows.map(({ entityType, ...item }) => [
      item.id,
      { ...item, bookable: entityType.capabilities.includes("BOOKABLE"), type: entityType },
    ]),
  );
  const typeIds = unique({ ids: rows.map((row) => row.entityTypeId) });
  const seats = await loadLayoutSeats({ context, itemIds });
  const states = await loadStartStates({ context, statusId, entityTypeIds: typeIds });
  return {
    items,
    changeovers: new Map(setups.map((setup) => [setup.id, setup.changeoverMinutes])),
    capacities: new Map(
      itemSetups.flatMap((row) => {
        const seatCount = seats.get(layoutKey(row))?.seatCount ?? null;
        const { effectiveCapacity: capacity } = effectiveCapacity({
          capacity: row.capacity,
          seatCount,
        });
        return capacity === null ? [] : [[`${row.itemId} ${row.setupId}`, capacity] as const];
      }),
    ),
    stateOf: ({ entityTypeId }) => states.get(entityTypeId) ?? null,
  };
}

export type LineBuffersInput = { line: PlannedLine; sources: PlanSources };

/** The line's effective setup and teardown minutes (ADR 0059), as the holds trigger derives them. */
export function lineBuffers({ line, sources }: LineBuffersInput) {
  const item = line.itemId ? sources.items.get(line.itemId) : undefined;
  const buffers = effectiveBuffers({
    item: item ?? null,
    type: item?.type ?? null,
    changeoverMinutes: line.setupId ? (sources.changeovers.get(line.setupId) ?? null) : null,
  });
  return { setup: buffers.effectiveSetupMinutes, teardown: buffers.effectiveTeardownMinutes };
}
