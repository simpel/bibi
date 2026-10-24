import "server-only";
import {
  type EntityTypeDto,
  type ItemDemandDto,
  listEntityTypes,
  listItemDemands,
  listItems,
  type Result,
} from "@bibi/core";
import { runOperation } from "@/server/run-operation";
import type { DemandListKind, DemandRow, PoolOption } from "./ui/demand-types";

const LIMIT = 100;

export type DemandLists = {
  rows: Record<DemandListKind, DemandRow[]>;
  pools: Record<DemandListKind, PoolOption[]>;
};

type TargetInput = {
  demand: ItemDemandDto;
  types: ReadonlyMap<string, EntityTypeDto>;
  items: ReadonlyMap<string, { name: string; entityTypeId: string }>;
};

/** The target's name and the kind of its type: Equipment lists under Resources, Person under Staffing. */
function targetOf({ demand, types, items }: TargetInput) {
  const item = demand.targetItemId ? items.get(demand.targetItemId) : undefined;
  const type = types.get(demand.entityTypeId ?? item?.entityTypeId ?? "");
  const name = item?.name ?? type?.name ?? "–";
  return { name, kind: (type?.resourceKind ?? "EQUIPMENT") satisfies DemandListKind };
}

/**
 * The item's demands split into Resources and Staffing, and the pools each list can add (bookable
 * item types of that kind). Without `item:read` the whole section is hidden by its caller.
 */
export async function loadDemandLists({
  itemId,
}: {
  itemId: string;
}): Promise<Result<DemandLists>> {
  const [demands, types, items] = await Promise.all([
    runOperation({ operation: listItemDemands, input: { itemId, limit: LIMIT } }),
    runOperation({ operation: listEntityTypes, input: { base: "ITEM", limit: LIMIT } }),
    runOperation({ operation: listItems, input: { limit: LIMIT } }),
  ]);
  if (!demands.ok) return demands;
  if (!types.ok) return types;
  if (!items.ok) return items;
  const typeById = new Map(types.value.items.map((type) => [type.id, type]));
  const itemById = new Map(items.value.items.map((item) => [item.id, item]));
  const rows: DemandLists["rows"] = { EQUIPMENT: [], PERSON: [] };
  for (const demand of demands.value.items.filter(({ status }) => status === "ACTIVE")) {
    const { name, kind } = targetOf({ demand, types: typeById, items: itemById });
    rows[kind].push({ demand, targetName: name });
  }
  const poolsOf = ({ kind }: { kind: DemandListKind }) =>
    types.value.items
      .filter((type) => type.capabilities.includes("BOOKABLE") && type.resourceKind === kind)
      .map(({ id, name }) => ({ id, name }));
  const pools = { EQUIPMENT: poolsOf({ kind: "EQUIPMENT" }), PERSON: poolsOf({ kind: "PERSON" }) };
  return { ok: true, value: { rows, pools } };
}
