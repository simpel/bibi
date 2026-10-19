import { defineOperation } from "../../operations/define-operation";
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
  permission: "itemState:admin",
  handler: ({ input, context }) => archiveState({ context, input }),
});
