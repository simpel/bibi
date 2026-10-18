import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { insertItemState } from "../item-state/insert-item-state";
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

type DefaultStateInput = { context: OperationContext; type: EntityTypeDto };

/**
 * Every item type has at least one state (ADR 0044): a new one starts with the initial state
 * "Active", which holds a bookable item hard (as a booking) and is included in sheets. The
 * organization renames it or adds its own states with `itemState.*`.
 */
const insertDefaultState = ({ context, type }: DefaultStateInput) =>
  insertItemState({
    context,
    entityTypeId: type.id,
    name: "Active",
    color: "#64748b",
    initial: true,
    hold: type.behaviours.includes("BOOKABLE") ? "HARD" : "NONE",
    inSheets: true,
  });

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
    },
  });
  const type = await toEntityTypeDto({ context, row });
  context.recordChange({ entityId: row.id, after: type });
  if (base !== "ITEM") return ok({ value: type });
  const state = await insertDefaultState({ context, type });
  return state.ok ? ok({ value: type }) : state;
}
