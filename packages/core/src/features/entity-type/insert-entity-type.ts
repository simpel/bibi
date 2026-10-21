import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { insertItemState } from "../item-state/insert-item-state";
import { checkCapabilities } from "./capabilities";
import type { EntityBase, ItemCapability } from "./capability-kinds";
import { toEntityTypeDto } from "./load-entity-type";
import type { EntityTypeDto } from "./schema";
import { checkTypeBuffers } from "./type-buffers";

export type InsertEntityTypeInput = {
  context: OperationContext;
  base: EntityBase;
  name: string;
  capabilities?: readonly ItemCapability[];
  /** Item types: default buffers (ADR 0059); null = none. */
  setupMinutes?: number | null;
  teardownMinutes?: number | null;
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
    hold: type.capabilities.includes("BOOKABLE") ? "HARD" : "NONE",
    inSheets: true,
  });

/** Shared by `entityType.create` and `configuration.importTemplate`: check, insert, record. */
export async function insertEntityType({
  context,
  base,
  name,
  capabilities = [],
  ...buffers
}: InsertEntityTypeInput): Promise<Result<EntityTypeDto>> {
  const valid = checkCapabilities({ base, capabilities });
  if (!valid.ok) return valid;
  const buffered = checkTypeBuffers({ base, ...buffers });
  if (!buffered.ok) return buffered;
  if (await context.db.entityType.findFirst({ where: { base, name } })) {
    return conflict({ message: `A type named "${name}" exists` });
  }
  const row = await context.db.entityType.create({
    data: {
      ...{ base, name, capabilities: [...capabilities], ...buffers },
      organizationId: context.organizationId,
    },
  });
  const type = await toEntityTypeDto({ context, row });
  context.recordChange({ entityId: row.id, after: type });
  if (base !== "ITEM") return ok({ value: type });
  const state = await insertDefaultState({ context, type });
  return state.ok ? ok({ value: type }) : state;
}
