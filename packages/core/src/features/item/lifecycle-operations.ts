import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { archiveRecords } from "../../records/update-record";
import { notFound } from "../../shared/errors";
import { checkNotLinked } from "../field-definition/link-usage";
import { checkItemsUnused } from "./archive-guard";
import { itemEmbeddable } from "./embeddable";
import { ItemIdInputSchema, ItemSchema } from "./schema";
import { loadItem, toItemDtos } from "./to-item-dto";

export const archiveItem = defineOperation({
  name: "item.archive",
  kind: "command",
  description:
    "Archive (soft-delete) an item. Archived items are hidden from lists and search. Refused " +
    "while another record's LINK field points to it, an active line occupies it or a " +
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
    const unused = await checkItemsUnused({ context, items: [before] });
    if (!unused.ok) return unused;
    const row = await context.db.item.update({ where: { id }, data: { status: "ARCHIVED" } });
    await archiveRecords({ context, ids: [id] });
    const [item] = await toItemDtos({ context, rows: [row] });
    if (!item) return notFound({ entity: "Item" });
    context.recordChange({ entityId: id, before, after: item });
    return ok({ value: item });
  },
});
