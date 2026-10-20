import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { countRecordsOfType } from "../field-definition/field-usage";
import { checkNotOnSheets } from "../sheet-definition/usage";
import type { EntityBase } from "./behaviour-kinds";
import { checkBehaviours, checkBehavioursRemovable } from "./behaviours";
import { checkExpiryState } from "./expiry-state";
import { insertEntityType } from "./insert-entity-type";
import { toEntityTypeDto } from "./load-entity-type";
import {
  EntityTypeCreateInputSchema,
  EntityTypeIdInputSchema,
  EntityTypeSchema,
  EntityTypeUpdateInputSchema,
} from "./schema";

type NameTakenInput = {
  context: Pick<OperationContext, "db">;
  base: EntityBase;
  name: string;
  id?: string;
};

async function nameTaken({ context, base, name, id }: NameTakenInput) {
  const found = await context.db.entityType.findFirst({ where: { base, name } });
  return found !== null && found.id !== id;
}

const taken = ({ name }: { name: string }) =>
  conflict({ message: `A type named "${name}" exists` });

export const createEntityType = defineOperation({
  name: "entityType.create",
  kind: "command",
  description:
    "Create one of the organization's own types, e.g. an item type Konferensrum with " +
    "BOOKABLE + SETUPS + PRICED. Names are unique per base entity. Add fields afterwards " +
    "with fieldDefinition.create.",
  input: EntityTypeCreateInputSchema,
  output: EntityTypeSchema,
  permission: "configuration:write",
  handler: ({ input, context }) => insertEntityType({ context, ...input }),
});

export const updateEntityType = defineOperation({
  name: "entityType.update",
  kind: "command",
  description:
    "Rename a type, replace its behaviours or set an item type's expiry state (where lines in " +
    "an expiring state fall when the ticket's holdsUntil passes). Switching a behaviour off while items of the " +
    "type have data for it (e.g. prices for PRICED) is refused with CONFLICT.",
  input: EntityTypeUpdateInputSchema,
  output: EntityTypeSchema,
  permission: "configuration:write",
  handler: async ({ input: { id, ...data }, context }) => {
    const before = await context.db.entityType.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "Type" });
    const behaviours = data.behaviours ?? before.behaviours;
    const valid = checkBehaviours({ base: before.base, behaviours });
    if (!valid.ok) return valid;
    const removed = before.behaviours.filter((behaviour) => !behaviours.includes(behaviour));
    const removable = await checkBehavioursRemovable({ context, entityTypeId: id, removed });
    if (!removable.ok) return removable;
    const expiry = await checkExpiryState({
      context,
      type: before,
      expiryStateId: data.expiryStateId,
    });
    if (!expiry.ok) return expiry;
    if (data.name && (await nameTaken({ context, base: before.base, name: data.name, id }))) {
      return taken({ name: data.name });
    }
    const row = await context.db.entityType.update({ where: { id }, data });
    const type = await toEntityTypeDto({ context, row });
    context.recordChange({ entityId: id, before, after: type });
    return ok({ value: type });
  },
});

export const archiveEntityType = defineOperation({
  name: "entityType.archive",
  kind: "command",
  description:
    "Archive a type. Refused while active records (items, customers, contacts, tickets, " +
    "program items, requirements) still have the " +
    "type, a LINK field points to it, or a sheet definition includes it.",
  input: EntityTypeIdInputSchema,
  output: EntityTypeSchema,
  permission: "configuration:delete",
  handler: async ({ input: { id }, context }) => {
    const before = await context.db.entityType.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "Type" });
    const used = await countRecordsOfType({ context, entityTypeId: id });
    if (used > 0) return conflict({ message: `${used} records have the type ${before.name}` });
    const linking = await context.db.fieldDefinition.count({ where: { linkTypeId: id } });
    if (linking > 0)
      return conflict({ message: `${linking} LINK fields point to the type ${before.name}` });
    const what = `The type ${before.name}`;
    const onSheets = await checkNotOnSheets({ context, reference: { entityTypeId: id }, what });
    if (!onSheets.ok) return onSheets;
    const row = await context.db.entityType.update({ where: { id }, data: { status: "ARCHIVED" } });
    const type = await toEntityTypeDto({ context, row });
    context.recordChange({ entityId: id, before, after: type });
    return ok({ value: type });
  },
});
