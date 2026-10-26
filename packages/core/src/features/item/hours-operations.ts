import { ok } from "../../errors/result";
import { ItemHoursGetInputSchema, ItemHoursSetInputSchema } from "../../hours/owner-schema";
import { HoursSchema } from "../../hours/schema";
import { loadHours, replaceHours } from "../../hours/store";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { loadZoneOfVenue } from "../../shared/time-zones";

type ZoneInput = { context: Pick<OperationContext, "db">; itemId: string };

/** The active item's zone (its venue's, else the organization's), or null when there is none. */
async function itemZone({ context, itemId }: ZoneInput) {
  const [item, zoneOf] = await Promise.all([
    context.db.item.findFirst({
      where: { id: itemId },
      select: { venue: { select: { timeZone: true } } },
    }),
    loadZoneOfVenue({ context }),
  ]);
  return item ? zoneOf({ venue: item.venue }) : null;
}

/** Whose hours the item works: a linked staff item works its member's (#449), else its own. */
async function ownerOf({ context, itemId }: ZoneInput) {
  const link = await context.db.memberProfileItem.findFirst({
    where: { itemId },
    select: { memberProfileId: true },
  });
  return link ? { memberProfileId: link.memberProfileId } : { itemId };
}

export const getItemHours = defineOperation({
  name: "itemHours.get",
  kind: "query",
  description:
    "Read an item's working hours (ADR 0064), e.g. when a boat or a technician is available: a " +
    "weekly pattern (weekday 0 = Monday, start, end and optional break in minutes after " +
    "midnight; a missing weekday is closed) plus dated exceptions, in the item's zone. Without " +
    "own hours the item follows its venue's opening hours. A staff item linked to a member " +
    "shows the member's working hours here. Advisory only.",
  input: ItemHoursGetInputSchema,
  output: HoursSchema,
  permission: "item:read",
  entityType: "item",
  handler: async ({ input: { itemId }, context }) => {
    const timeZone = await itemZone({ context, itemId });
    if (!timeZone) return notFound({ entity: "Item" });
    const owner = await ownerOf({ context, itemId });
    return ok({ value: await loadHours({ context, owner, timeZone }) });
  },
});

export const setItemHours = defineOperation({
  name: "itemHours.set",
  kind: "command",
  description:
    "Replace an item's working hours with `days` (each weekday at most once) and `exceptions` " +
    "(each date at most once; no times = closed). Minutes after midnight in the item's zone. " +
    "Empty `days` and `exceptions` make the item follow its venue again. Hours only warn. A " +
    "staff item linked to a member is a CONFLICT: the member's working hours apply.",
  input: ItemHoursSetInputSchema,
  output: HoursSchema,
  permission: "item:write",
  entityType: "item",
  handler: async ({ input: { itemId, ...pattern }, context }) => {
    const timeZone = await itemZone({ context, itemId });
    if (!timeZone) return notFound({ entity: "Item" });
    if ("memberProfileId" in (await ownerOf({ context, itemId }))) {
      const message = "This staff item works its member's hours; change them on the member";
      return conflict({ message, issues: [{ path: "itemId", message }] });
    }
    const owner = { itemId };
    const before = await loadHours({ context, owner, timeZone });
    const after = await replaceHours({ context, owner, timeZone, pattern });
    context.recordChange({ entityId: itemId, before: { hours: before }, after: { hours: after } });
    return ok({ value: after });
  },
});

/** Item working hours (ADR 0064 rule 10; #388 adds the availability read model). */
export const itemHoursOperations = [getItemHours, setItemHours];
