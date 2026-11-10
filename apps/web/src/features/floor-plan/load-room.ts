import "server-only";
import {
  type FloorElementKindDto,
  type FloorPlanDto,
  getFloorPlan,
  type ItemDto,
  listFloorElementKinds,
  listSetups,
  type Result,
} from "@bibi/core";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";
import { loadItem } from "../item/load-item";

export type RoomData = {
  item: ItemDto;
  plan: FloorPlanDto;
  kinds: readonly FloorElementKindDto[];
  /** Setup names by id (the organization's setups). */
  setupNames: ReadonlyMap<string, string>;
  canEdit: boolean;
  canImportKinds: boolean;
};

/**
 * What both the floor plan and the layouts page need, read in parallel (ADR 0097): the item, its
 * plan with every layout, the setup names, the furniture library and the caller's abilities.
 */
export async function loadRoom({ itemId }: { itemId: string }): Promise<Result<RoomData>> {
  const [item, plan, setups, kinds, abilities] = await Promise.all([
    loadItem({ id: itemId }),
    runOperation({ operation: getFloorPlan, input: { itemId } }),
    runOperation({ operation: listSetups, input: { limit: 100 } }),
    runOperation({ operation: listFloorElementKinds, input: { limit: 100 } }),
    getCallerAbilities(),
  ]);
  if (!item.ok) return item;
  if (!plan.ok) return plan;
  if (!setups.ok) return setups;
  if (!kinds.ok) return kinds;
  return {
    ok: true,
    value: {
      item: item.value,
      plan: plan.value,
      kinds: kinds.value.items,
      setupNames: new Map(setups.value.items.map((setup) => [setup.id, setup.name])),
      canEdit: can({ abilities, permission: "item:write" }),
      canImportKinds: can({ abilities, permission: "configuration:write" }),
    },
  };
}
