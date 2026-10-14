import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import type { EntityBase, ItemBehaviour } from "./behaviour-kinds";
import { checkBehaviours } from "./behaviours";
import { toEntityTypeDto } from "./load-entity-type";
import type { EntityTypeDto } from "./schema";

export type InsertEntityTypeInput = {
  context: OperationContext;
  base: EntityBase;
  name: string;
  behaviours?: readonly ItemBehaviour[];
};

/** Shared by `entityType.create` and `configuration.importTemplate`: check, insert, record. */
export async function insertEntityType({
  context,
  base,
  name,
  behaviours = [],
}: InsertEntityTypeInput): Promise<Result<EntityTypeDto>> {
  const valid = checkBehaviours({ base, behaviours });
  if (!valid.ok) return valid;
  if (await context.db.entityType.findFirst({ where: { base, name } })) {
    return conflict({ message: `A type named "${name}" exists` });
  }
  const row = await context.db.entityType.create({
    data: {
      ...{ base, name, behaviours: [...behaviours] },
      organizationId: context.organizationId,
      createdBy: context.actor.userId,
    },
  });
  const type = await toEntityTypeDto({ context, row });
  context.recordChange({ entityId: row.id, after: type });
  return ok({ value: type });
}
