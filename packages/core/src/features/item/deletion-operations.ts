import {
  defineDeleteOperation,
  defineRestoreOperation,
} from "../../archive/define-lifecycle-operations";
import { itemKind } from "./deletion-kind";
import { itemEmbeddable } from "./embeddable";
import { getItem } from "./read-operations";
import { ItemIdInputSchema } from "./schema";

export const restoreItem = defineRestoreOperation({
  name: "item.restore",
  description:
    "Restore an archived item: it is active again. CONFLICT when it is not archived or its " +
    "type, venue or customer is archived.",
  permission: "item:delete",
  kind: itemKind,
  input: ItemIdInputSchema,
  get: getItem,
  embeddable: itemEmbeddable,
});

export const deleteItem = defineDeleteOperation({
  name: "item.delete",
  description:
    "Delete an archived item permanently (ADR 0118), with its prices, hours, floor plans, " +
    "demands, setups, parts and options. An active item is CONFLICT: archive it first. CONFLICT " +
    "while a line, quote, order version, package, task or another item still uses it.",
  permission: "item:delete",
  kind: itemKind,
  input: ItemIdInputSchema,
});
