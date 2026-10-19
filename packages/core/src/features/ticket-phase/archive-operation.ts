import { defineOperation } from "../../operations/define-operation";
import { archivePhase } from "./archive-phase";
import { TicketPhaseArchiveInputSchema, TicketPhaseSchema } from "./schema";

export const archiveTicketPhase = defineOperation({
  name: "ticketPhase.archive",
  kind: "command",
  description:
    "Archive a ticket phase (phases are never deleted). A phase that holds tickets needs " +
    "`targetPhaseId`: its tickets move there through the normal move checks (transition and " +
    "flags), all or none. Its transitions are removed. The last entry or terminal phase cannot " +
    "be archived (CONFLICT), nor a phase predefined tickets start in. Its phase grid cells are cleared.",
  input: TicketPhaseArchiveInputSchema,
  output: TicketPhaseSchema,
  permission: "ticketPhase:admin",
  handler: ({ input, context }) => archivePhase({ context, input }),
});
