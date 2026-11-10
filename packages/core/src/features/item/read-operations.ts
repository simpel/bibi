import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import type { ItemCapability } from "../entity-type/capability-kinds";
import { ItemListInputSchema, ItemListOutputSchema } from "./list-schema";
import { ItemIdInputSchema, ItemSchema } from "./schema";
import { loadItem, toItemDtos } from "./to-item-dto";

type OwnerFilterInput = { customerId?: string | undefined; onlyCustomer?: boolean | undefined };

type TypeFilterInput = {
  capability?: ItemCapability | undefined;
  groupId?: string | null | undefined;
};

/** Filters on the item's type: a capability and/or a group (ADR 0101; null = ungrouped). */
function typeFilter({ capability, groupId }: TypeFilterInput) {
  const entityType = {
    ...(capability ? { capabilities: { has: capability } } : {}),
    ...(groupId !== undefined ? { groupId } : {}),
  };
  return Object.keys(entityType).length > 0 ? { entityType } : {};
}

/** The catalog, plus or instead of one customer's own bundles (ADR 0021). */
function ownerFilter({ customerId, onlyCustomer }: OwnerFilterInput) {
  if (!customerId) return { customerId: null };
  if (onlyCustomer) return { customerId };
  return { OR: [{ customerId: null }, { customerId }] };
}

export const listItems = defineOperation({
  name: "item.list",
  kind: "query",
  description:
    "List the organization's items (artiklar): everything it sells or books, e.g. rooms, " +
    "dishes or boats. Filter by type, type group, venue or capability (BOOKABLE for bookable " +
    "resources). " +
    "Lists the catalog; with customerId it also lists that customer's own bundles.",
  input: ItemListInputSchema,
  output: ItemListOutputSchema,
  permission: "item:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.item.findMany({
      where: {
        ...(input.entityTypeId ? { entityTypeId: input.entityTypeId } : {}),
        ...(input.venueId ? { venueId: input.venueId } : {}),
        ...typeFilter(input),
        ...ownerFilter(input),
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    const items = await toItemDtos({ context, rows: page.items });
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getItem = defineOperation({
  name: "item.get",
  kind: "query",
  description: "Get one item by id, with its field values, setup capacities and parts.",
  input: ItemIdInputSchema,
  output: ItemSchema,
  permission: "item:read",
  handler: async ({ input, context }) => {
    const item = await loadItem({ context, id: input.id });
    return item ? ok({ value: item }) : notFound({ entity: "Item" });
  },
});
