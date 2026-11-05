import type { DemandWindow } from "@bibi/db";
import type { OperationContext } from "../../../operations/types";
import { poolUnitsWhere } from "../../item/pool-free-units";

type Db = { context: Pick<OperationContext, "db"> };

/** A mandatory demand of an item and the units of its target, before availability. */
export type PlanDemand = {
  id: string;
  itemId: string;
  quantity: number;
  windows: DemandWindow[];
  unitIds: readonly string[];
};

type DemandRow = {
  id: string;
  itemId: string;
  quantity: number;
  windows: DemandWindow[];
  targetItemId: string | null;
  entityTypeId: string | null;
  tags: { valueId: string }[];
};

const targetKey = ({ demand }: { demand: DemandRow }) =>
  [
    demand.targetItemId ?? "",
    demand.entityTypeId ?? "",
    ...demand.tags.map((t) => t.valueId).sort(),
  ].join(" ");

type UnitsInput = Db & { demand: DemandRow };

/** The target's units (`poolUnitsWhere`, as `item.freeUnits`); none when the target is gone. */
async function unitsOf({ context, demand }: UnitsInput): Promise<string[]> {
  const input = {
    itemId: demand.targetItemId,
    entityTypeId: demand.entityTypeId,
    tagValueIds: demand.tags.map((tag) => tag.valueId),
  };
  const where = await poolUnitsWhere({ context, input });
  if (!where.ok) return [];
  const units = await context.db.item.findMany({ where: where.value, select: { id: true } });
  return units.map((unit) => unit.id);
}

export type LoadPlanDemandsInput = Db & { itemIds: readonly string[] };

/**
 * The mandatory demands of the items (ADR 0059) with their targets' units: one query for the
 * demands, then one per distinct target (not per line or package), so the cost follows the
 * catalog, not the plan. Optional demands only warn on a saved line and are left out.
 */
export async function loadPlanDemands({
  context,
  itemIds,
}: LoadPlanDemandsInput): Promise<Map<string, PlanDemand[]>> {
  const out = new Map<string, PlanDemand[]>();
  if (itemIds.length === 0) return out;
  const rows: DemandRow[] = await context.db.itemDemand.findMany({
    where: { itemId: { in: [...new Set(itemIds)] }, required: true },
    select: {
      ...{ id: true, itemId: true, quantity: true, windows: true },
      ...{ targetItemId: true, entityTypeId: true, tags: { select: { valueId: true } } },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const units = new Map<string, readonly string[]>();
  for (const demand of rows) {
    const key = targetKey({ demand });
    if (!units.has(key)) units.set(key, await unitsOf({ context, demand }));
    const planned: PlanDemand = {
      ...{ id: demand.id, itemId: demand.itemId, quantity: demand.quantity },
      ...{ windows: demand.windows, unitIds: units.get(key) ?? [] },
    };
    out.set(demand.itemId, [...(out.get(demand.itemId) ?? []), planned]);
  }
  return out;
}
