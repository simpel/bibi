import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import type { EntityBase } from "./behaviour-kinds";
import { checkBehaviours, checkBehavioursRemovable } from "./behaviours";
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

const taken = ({ name }: { name: string }) => conflict({ message: `A type named "${name}" exists` });

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
  handler: async ({ input: { base, name, behaviours = [] }, context }) => {
    const valid = checkBehaviours({ base, behaviours });
    if (!valid.ok) return valid;
    if (await nameTaken({ context, base, name })) return taken({ name });
    const row = await context.db.entityType.create({
      data: {
        ...{ base, name, behaviours },
        organizationId: context.organizationId,
        createdBy: context.actor.userId,
      },
    });
    const type = await toEntityTypeDto({ context, row });
    context.recordChange({ entityId: row.id, after: type });
    return ok({ value: type });
  },
});

export const updateEntityType = defineOperation({
  name: "entityType.update",
  kind: "command",
  description:
    "Rename a type or replace its behaviours. Switching a behaviour off while items of the " +
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
  description: "Archive a type. Refused while active items still have the type.",
  input: EntityTypeIdInputSchema,
  output: EntityTypeSchema,
  permission: "configuration:write",
  handler: async ({ input: { id }, context }) => {
    const before = await context.db.entityType.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "Type" });
    const items = await context.db.item.count({ where: { entityTypeId: id } });
    if (items > 0) return conflict({ message: `${items} items have the type ${before.name}` });
    const row = await context.db.entityType.update({ where: { id }, data: { status: "ARCHIVED" } });
    const type = await toEntityTypeDto({ context, row });
    context.recordChange({ entityId: id, before, after: type });
    return ok({ value: type });
  },
});
