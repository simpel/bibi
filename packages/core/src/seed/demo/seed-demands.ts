import { ok, type Result } from "../../errors/result";
import { createItemDemand } from "../../features/item-demand/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoItem } from "./config-types";
import type { DemoRefs } from "./demo-refs";
import { missing } from "./seed-fields";

export type SeedDemandsInput = {
  context: ExecuteContext;
  item: DemoItem;
  itemId: string;
  refs: DemoRefs;
};

/** The item's demands on pools (ADR 0059), via `itemDemand.create` as SYSTEM. */
export async function seedItemDemands({
  context,
  item,
  itemId,
  refs,
}: SeedDemandsInput): Promise<Result<number>> {
  for (const demand of item.demands ?? []) {
    const pool = refs.itemTypes.get(demand.pool);
    if (!pool) return missing({ what: `pool ${demand.pool}` });
    const input = {
      itemId,
      entityTypeId: pool.id,
      windows: [...demand.windows],
      quantity: demand.quantity ?? 1,
      required: !demand.optional,
    };
    const created = await execute({ operation: createItemDemand, input, context });
    if (!created.ok) return created;
  }
  return ok({ value: item.demands?.length ?? 0 });
}
