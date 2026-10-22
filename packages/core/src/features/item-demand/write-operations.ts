import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { resyncDemandLines } from "./demand-lines";
import { checkDemandTarget, checkNeedingItem } from "./demand-rules";
import {
  ItemDemandCreateInputSchema,
  ItemDemandIdInputSchema,
  ItemDemandSchema,
  ItemDemandUpdateInputSchema,
} from "./schema";
import { loadDemand, replaceDemandTags } from "./to-demand-dto";

const RESYNC_NOTE =
  "Lines of the item that have not ended get their allocations re-derived (the first free unit " +
  "in pool order fills an empty slot); a mandatory demand with no free unit gives CONFLICT " +
  "naming the pool and window.";

export const createItemDemand = defineOperation({
  name: "itemDemand.create",
  kind: "command",
  description:
    "Add a demand to an item (ADR 0059): every line booking the item needs `quantity` units of " +
    "a target, held for the given windows of the line (SETUP, BOOKING, TEARDOWN) with the line's " +
    "hold kind. The target is one bookable item (targetItemId) or a pool (entityTypeId of a " +
    "bookable item type plus tagValueIds). E.g. a projector needs one technician for SETUP and " +
    `TEARDOWN. ${RESYNC_NOTE}`,
  input: ItemDemandCreateInputSchema,
  output: ItemDemandSchema,
  permission: "item:write",
  handler: async ({ input: { tagValueIds, ...input }, context }) => {
    const item = await checkNeedingItem({ context, itemId: input.itemId });
    if (!item.ok) return item;
    const target = { itemId: input.targetItemId, entityTypeId: input.entityTypeId, tagValueIds };
    const valid = await checkDemandTarget({ context, itemId: input.itemId, target });
    if (!valid.ok) return valid;
    const row = await context.db.itemDemand.create({
      data: { ...input, organizationId: context.organizationId },
    });
    await replaceDemandTags({ context, demandId: row.id, tagValueIds });
    const demand = await loadDemand({ context, id: row.id });
    if (!demand) return notFound({ entity: "Demand" });
    context.recordChange({ entityId: row.id, after: demand });
    const synced = await resyncDemandLines({ context, itemId: input.itemId });
    return synced.ok ? ok({ value: demand }) : synced;
  },
});

export const updateItemDemand = defineOperation({
  name: "itemDemand.update",
  kind: "command",
  description:
    "Change a demand: mandatory or optional, quantity, windows or the pool's tags. Omitted " +
    `properties are unchanged; the target itself stays (archive and add again). ${RESYNC_NOTE}`,
  input: ItemDemandUpdateInputSchema,
  output: ItemDemandSchema,
  permission: "item:write",
  handler: async ({ input: { id, tagValueIds, ...data }, context }) => {
    const before = await loadDemand({ context, id });
    if (!before) return notFound({ entity: "Demand" });
    if (tagValueIds) {
      const target = {
        entityTypeId: before.entityTypeId,
        itemId: before.targetItemId,
        tagValueIds,
      };
      const valid = await checkDemandTarget({ context, itemId: before.itemId, target });
      if (!valid.ok) return valid;
      await replaceDemandTags({ context, demandId: id, tagValueIds });
    }
    await context.db.itemDemand.update({ where: { id }, data });
    const after = await loadDemand({ context, id });
    if (!after) return notFound({ entity: "Demand" });
    context.recordChange({ entityId: id, before, after });
    const synced = await resyncDemandLines({ context, itemId: before.itemId });
    return synced.ok ? ok({ value: after }) : synced;
  },
});

export const archiveItemDemand = defineOperation({
  name: "itemDemand.archive",
  kind: "command",
  description:
    "Remove (archive) a demand. Its allocations on lines that have not ended go, and their " +
    "units are released; allocations on past lines stay as history.",
  input: ItemDemandIdInputSchema,
  output: ItemDemandSchema,
  permission: "item:write",
  handler: async ({ input: { id }, context }) => {
    const before = await loadDemand({ context, id });
    if (!before) return notFound({ entity: "Demand" });
    await context.db.itemDemand.update({ where: { id }, data: { status: "ARCHIVED" } });
    const after = { ...before, status: "ARCHIVED" as const };
    context.recordChange({ entityId: id, before, after });
    const synced = await resyncDemandLines({ context, itemId: before.itemId });
    return synced.ok ? ok({ value: after }) : synced;
  },
});
