import "server-only";
import {
  type FloorElementKindDto,
  type FloorPlanDto,
  getFloorPlan,
  type ItemDto,
  listFloorElementKinds,
  type Result,
} from "@bibi/core";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";
import { loadItem } from "../item/load-item";

export type RoomData = {
  item: ItemDto;
  plan: FloorPlanDto;
  kinds: readonly FloorElementKindDto[];
  canEdit: boolean;
  canImportKinds: boolean;
};

/**
 * What both the floor plan and the layouts page need, read in parallel (ADR 0097): the item, its
 * plan with every layout, the furniture library and the caller's abilities.
 */
export async function loadRoom({ itemId }: { itemId: string }): Promise<Result<RoomData>> {
  const [item, plan, kinds, abilities] = await Promise.all([
    loadItem({ id: itemId }),
    runOperation({ operation: getFloorPlan, input: { itemId } }),
    runOperation({ operation: listFloorElementKinds, input: { limit: 100 } }),
    getCallerAbilities(),
  ]);
  if (!item.ok) return item;
  if (!plan.ok) return plan;
  if (!kinds.ok) return kinds;
  return {
    ok: true,
    value: {
      item: item.value,
      plan: plan.value,
      kinds: kinds.value.items,
      canEdit: can({ abilities, permission: "item:write" }),
      canImportKinds: can({ abilities, permission: "configuration:write" }),
    },
  };
}
