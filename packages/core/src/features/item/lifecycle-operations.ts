import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict, notFound } from "../../shared/errors";
import { inUseConflict } from "../../shared/in-use";
import { checkNotLinked } from "../field-definition/link-usage";
import { itemEmbeddable } from "./embeddable";
import { ItemIdInputSchema, ItemSchema } from "./schema";
import { loadItem, toItemDtos } from "./to-item-dto";

export const archiveItem = defineOperation({
  name: "item.archive",
  kind: "command",
  description:
    "Archive (soft-delete) an item. Archived items are hidden from lists and search. Refused " +
    "while another record's LINK field points to it, an active program item occupies it or a " +
    "predefined ticket has a line with it.",
  input: ItemIdInputSchema,
  output: ItemSchema,
  permission: "item:delete",
  embeddable: itemEmbeddable,
  handler: async ({ input: { id }, context }) => {
    const before = await loadItem({ context, id });
    if (!before) return notFound({ entity: "Item" });
    const records = [{ id, entityTypeId: before.entityTypeId }];
    const linked = await checkNotLinked({ context, records, what: before.name });
    if (!linked.ok) return linked;
    const scheduled = await context.db.programItem.count({ where: { itemId: id } });
    if (scheduled > 0) {
      const message = `${before.name} is used by ${scheduled} active program items`;
      return inUseConflict({ context, feature: "program", message });
    }
    const templated = await context.db.ticketTemplateLine.count({
      where: { itemId: id, template: { status: "ACTIVE" } },
    });
    if (templated > 0) {
      return conflict({
        message: `${before.name} is used by ${templated} predefined ticket lines`,
      });
    }
    const row = await context.db.item.update({ where: { id }, data: { status: "ARCHIVED" } });
    const [item] = await toItemDtos({ context, rows: [row] });
    if (!item) return notFound({ entity: "Item" });
    context.recordChange({ entityId: id, before, after: item });
    return ok({ value: item });
  },
});
