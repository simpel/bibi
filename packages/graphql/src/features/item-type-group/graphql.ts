import {
  archiveItemTypeGroup,
  createItemTypeGroup,
  getItemTypeGroup,
  type ItemTypeGroupDto,
  ItemTypeGroupSchema,
  listItemTypeGroups,
  reorderItemTypeGroups,
  updateItemTypeGroup,
} from "@bibi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const ItemTypeGroupRef = objectFromSchema<ItemTypeGroupDto>({
  name: "ItemTypeGroup",
  schema: ItemTypeGroupSchema,
  omit: ["organizationId"],
  description:
    "Item type group – the organization's own heading for browsing item types, e.g. Spaces or " +
    "Food (ADR 0101). A type points to it with groupId.",
});
const ItemTypeGroupPageRef = pageType({ name: "ItemTypeGroupPage", item: ItemTypeGroupRef });

fieldFromOperation({
  operation: listItemTypeGroups,
  type: ItemTypeGroupPageRef,
  name: "itemTypeGroups",
});
fieldFromOperation({ operation: getItemTypeGroup, type: ItemTypeGroupRef, name: "itemTypeGroup" });
mutationFromOperation({ operation: createItemTypeGroup, type: ItemTypeGroupRef });
mutationFromOperation({ operation: updateItemTypeGroup, type: ItemTypeGroupRef });
mutationFromOperation({ operation: archiveItemTypeGroup, type: ItemTypeGroupRef });
mutationFromOperation({ operation: reorderItemTypeGroups, type: ItemTypeGroupPageRef });
