import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { checkNeedingItem } from "./demand-rules";
import {
  ItemDemandIdInputSchema,
  ItemDemandListInputSchema,
  ItemDemandListOutputSchema,
  ItemDemandSchema,
} from "./schema";
import { DEMAND_INCLUDE, loadDemand, toDemandDto } from "./to-demand-dto";

export const listItemDemands = defineOperation({
  name: "itemDemand.list",
  kind: "query",
  description:
    "List what an item asks of pools (ADR 0059): per demand the target (a specific item, or a " +
    "pool: an item type plus list values every unit carries), mandatory or optional, how many " +
    "units and which line windows (SETUP, BOOKING, TEARDOWN) they are held for. The target " +
    "type's resourceKind (entityType.get) says Resources (EQUIPMENT) or Staffing (PERSON).",
  input: ItemDemandListInputSchema,
  output: ItemDemandListOutputSchema,
  permission: "item:read",
  handler: async ({ input, context }) => {
    const item = await checkNeedingItem({ context, itemId: input.itemId });
    if (!item.ok) return item;
    const rows = await context.db.itemDemand.findMany({
      where: { itemId: input.itemId },
      include: DEMAND_INCLUDE,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    return ok({ value: { ...page, items: page.items.map((row) => toDemandDto({ row })) } });
  },
});

export const getItemDemand = defineOperation({
  name: "itemDemand.get",
  kind: "query",
  description: "Get one item demand by id.",
  input: ItemDemandIdInputSchema,
  output: ItemDemandSchema,
  permission: "item:read",
  handler: async ({ input, context }) => {
    const demand = await loadDemand({ context, id: input.id });
    return demand ? ok({ value: demand }) : notFound({ entity: "Demand" });
  },
});
