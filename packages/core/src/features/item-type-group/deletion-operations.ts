import {
  defineDeleteOperation,
  defineRestoreOperation,
} from "../../archive/define-lifecycle-operations";
import { itemTypeGroupKind } from "./deletion-kind";
import { getItemTypeGroup } from "./operations";
import { ItemTypeGroupIdInputSchema } from "./schema";

export const restoreItemTypeGroup = defineRestoreOperation({
  name: "itemTypeGroup.restore",
  description:
    "Restore an archived item type group: it is active again, empty (its types were moved to " +
    "ungrouped when it was archived). CONFLICT when it is not archived.",
  permission: "configuration:delete",
  kind: itemTypeGroupKind,
  input: ItemTypeGroupIdInputSchema,
  get: getItemTypeGroup,
});

export const deleteItemTypeGroup = defineDeleteOperation({
  name: "itemTypeGroup.delete",
  description:
    "Delete an archived item type group permanently (ADR 0118). An active group is CONFLICT: " +
    "archive it first.",
  permission: "configuration:delete",
  kind: itemTypeGroupKind,
  input: ItemTypeGroupIdInputSchema,
});
