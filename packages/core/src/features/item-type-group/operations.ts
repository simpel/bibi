import { defineOperation } from "../../operations/define-operation";
import {
  archiveItemTypeGroupHandler,
  getItemTypeGroupHandler,
  insertItemTypeGroup,
  listItemTypeGroupsHandler,
  reorderItemTypeGroupsHandler,
  updateItemTypeGroupHandler,
} from "./handlers";
import {
  ItemTypeGroupCreateInputSchema,
  ItemTypeGroupIdInputSchema,
  ItemTypeGroupListInputSchema,
  ItemTypeGroupListOutputSchema,
  ItemTypeGroupReorderInputSchema,
  ItemTypeGroupSchema,
  ItemTypeGroupUpdateInputSchema,
} from "./schema";

export const listItemTypeGroups = defineOperation({
  name: "itemTypeGroup.list",
  kind: "query",
  description:
    "List the organization's item type groups in order (ADR 0101): its own headings for " +
    "browsing item types, e.g. Spaces, Food and Extras. A type's group is its groupId " +
    "(entityType.list); items are filtered by group with item.list groupId.",
  input: ItemTypeGroupListInputSchema,
  output: ItemTypeGroupListOutputSchema,
  permission: "configuration:read",
  handler: listItemTypeGroupsHandler,
});

export const getItemTypeGroup = defineOperation({
  name: "itemTypeGroup.get",
  kind: "query",
  description: "Get one item type group by id.",
  input: ItemTypeGroupIdInputSchema,
  output: ItemTypeGroupSchema,
  permission: "configuration:read",
  handler: getItemTypeGroupHandler,
});

export const createItemTypeGroup = defineOperation({
  name: "itemTypeGroup.create",
  kind: "command",
  description:
    "Create an item type group, placed last. Names are unique (ignoring case). Put a type in " +
    "it with entityType.update groupId. A group is only a heading: it changes no behaviour.",
  input: ItemTypeGroupCreateInputSchema,
  output: ItemTypeGroupSchema,
  permission: "configuration:write",
  handler: ({ input, context }) => insertItemTypeGroup({ context, name: input.name }),
});

export const updateItemTypeGroup = defineOperation({
  name: "itemTypeGroup.update",
  kind: "command",
  description: "Rename an item type group. Its types are unchanged.",
  input: ItemTypeGroupUpdateInputSchema,
  output: ItemTypeGroupSchema,
  permission: "configuration:write",
  handler: updateItemTypeGroupHandler,
});

export const reorderItemTypeGroups = defineOperation({
  name: "itemTypeGroup.reorder",
  kind: "command",
  description: "Set the order of the item type groups: pass every active group id once, in order.",
  input: ItemTypeGroupReorderInputSchema,
  output: ItemTypeGroupListOutputSchema,
  permission: "configuration:write",
  handler: reorderItemTypeGroupsHandler,
});

export const archiveItemTypeGroup = defineOperation({
  name: "itemTypeGroup.archive",
  kind: "command",
  description:
    "Archive an item type group. Its types become ungrouped (groupId null); types and items " +
    "are otherwise unchanged.",
  input: ItemTypeGroupIdInputSchema,
  output: ItemTypeGroupSchema,
  permission: "configuration:delete",
  handler: archiveItemTypeGroupHandler,
});

/** Every item type group operation (ADR 0101). */
export const itemTypeGroupOperations = [
  listItemTypeGroups,
  getItemTypeGroup,
  createItemTypeGroup,
  updateItemTypeGroup,
  reorderItemTypeGroups,
  archiveItemTypeGroup,
];
