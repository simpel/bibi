import "server-only";
import {
  getItemDemand,
  getLine,
  type ItemDemandDto,
  listEntityTypes,
  listItems,
  listLineAllocations,
  freeUnits as poolFreeUnits,
  type Result,
} from "@bibi/core";
import { runOperation } from "@/server/run-operation";
import type { AllocationSlot, AllocationView, UnitOption } from "./ui/allocation-types";

const LIMIT = 100;

type Names = ReadonlyMap<string, string>;

type FreeInput = { demand: ItemDemandDto; startsAt: Date; endsAt: Date };

/** The free units of the demand's target in the line's span, in pool order, with the prepick. */
async function freeOf({ demand, startsAt, endsAt }: FreeInput) {
  const target = demand.targetItemId
    ? { itemId: demand.targetItemId }
    : { entityTypeId: demand.entityTypeId ?? "", tagValueIds: demand.tagValueIds };
  return runOperation({
    operation: poolFreeUnits,
    input: { ...target, startsAt, endsAt, limit: LIMIT },
  });
}

type SlotInput = {
  allocation: {
    id: string;
    slot: number;
    unitId: string | null;
    parentAllocationId: string | null;
  };
  demand: ItemDemandDto;
  free: Free;
  names: Names;
};

function toSlot({ allocation, demand, free, names }: SlotInput): AllocationSlot {
  const { unitId } = allocation;
  const current = unitId && !free.items.some(({ id }) => id === unitId);
  const own = current ? [{ id: unitId, name: names.get(unitId) ?? "–" }] : [];
  const poolId = demand.entityTypeId ?? demand.targetItemId ?? "";
  return {
    id: allocation.id,
    poolName: names.get(poolId) ?? "–",
    slot: allocation.slot,
    required: demand.required,
    unitId,
    chained: allocation.parentAllocationId !== null,
    options: [...own, ...free.items],
    prepickId: free.prepickId,
  };
}

type Free = { items: UnitOption[]; prepickId: string | null };
type Loaded = { demand: ItemDemandDto; free: Free };

type LoadDemandsInput = { demandIds: readonly string[]; startsAt: Date; endsAt: Date };

/** Each distinct demand once, with its pool's free units (slots of one demand share them). */
async function loadDemands({
  demandIds,
  startsAt,
  endsAt,
}: LoadDemandsInput): Promise<Result<Map<string, Loaded>>> {
  const loaded = await Promise.all(
    [...new Set(demandIds)].map(async (id): Promise<Result<Loaded>> => {
      const demand = await runOperation({ operation: getItemDemand, input: { id } });
      if (!demand.ok) return demand;
      const free = await freeOf({ demand: demand.value, startsAt, endsAt });
      return free.ok ? { ok: true, value: { demand: demand.value, free: free.value } } : free;
    }),
  );
  const failed = loaded.find((result) => !result.ok);
  if (failed && !failed.ok) return failed;
  return {
    ok: true,
    value: new Map(loaded.flatMap((r) => (r.ok ? [[r.value.demand.id, r.value] as const] : []))),
  };
}

/**
 * The slots of a timed line's demands, each with the pool's free units for the line's span
 * (derived on read, ADR 0051). Null for an untimed line: nothing is held for it.
 */
export async function loadLineAllocations({
  lineId,
}: {
  lineId: string;
}): Promise<Result<AllocationView | null>> {
  const line = await runOperation({ operation: getLine, input: { id: lineId } });
  if (!line.ok) return line;
  const { startsAt, endsAt } = line.value;
  if (!startsAt || !endsAt) return { ok: true, value: null };
  const [allocations, items, types] = await Promise.all([
    runOperation({ operation: listLineAllocations, input: { lineId, limit: LIMIT } }),
    runOperation({ operation: listItems, input: { limit: LIMIT } }),
    runOperation({ operation: listEntityTypes, input: { base: "ITEM", limit: LIMIT } }),
  ]);
  if (!allocations.ok) return allocations;
  if (!items.ok) return items;
  if (!types.ok) return types;
  const names: Names = new Map(
    [...items.value.items, ...types.value.items].map(({ id, name }) => [id, name]),
  );
  const active = allocations.value.items.filter(({ status }) => status === "ACTIVE");
  const demands = await loadDemands({ demandIds: active.map((a) => a.demandId), startsAt, endsAt });
  if (!demands.ok) return demands;
  const slots = active.flatMap((allocation) => {
    const loaded = demands.value.get(allocation.demandId);
    return loaded ? [toSlot({ allocation, ...loaded, names })] : [];
  });
  return { ok: true, value: { startsAt, endsAt, slots } };
}
