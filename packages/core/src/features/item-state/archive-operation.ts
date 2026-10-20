import { defineOperation } from "../../operations/define-operation";
import { archiveConsequences } from "../../shared/archive-consequences";
import { canView } from "../../shared/can-view";
import { archiveState } from "./archive-state";
import { ItemStateArchiveInputSchema, ItemStateSchema } from "./schema";

export const archiveItemState = defineOperation({
  name: "itemState.archive",
  kind: "command",
  description:
    "Archive an item state (states are never deleted). When lines use it, `targetStateId` (a " +
    "state of the same type) is required: the lines move there with their holds, all or none. " +
    "A type whose expiry state it was and the phase grid cells that use it get the target (or " +
    "are cleared). Its transitions are removed. " +
    "The initial state cannot be archived until another state is initial (CONFLICT).",
  input: ItemStateArchiveInputSchema,
  output: ItemStateSchema,
  permission: "pipeline:delete",
  handler: ({ input, context }) => archiveState({ context, input }),
  consequences: async ({ input, context }) => {
    // Only counted for a caller who may view them (ADR 0050, feature scope).
    const moving = canView({ context, feature: "program" })
      ? await context.db.programItem.count({ where: { stateId: input.id } })
      : 0;
    const cells = await context.db.phaseStateRule.count({ where: { stateId: input.id } });
    const target = input.targetStateId
      ? await context.db.itemState.findFirst({ where: { id: input.targetStateId } })
      : null;
    return archiveConsequences({ moving, cells, target: target?.name ?? null, rows: "lines" });
  },
});
