import { defineOperation } from "../../operations/define-operation";
import { invalid, notFound } from "../../shared/errors";
import { moveTicket } from "./move-ticket";
import { TicketChangePhaseInputSchema, TicketSchema } from "./schema";
import { loadTicket } from "./to-ticket-dto";

export const changeTicketPhase = defineOperation({
  name: "ticket.changePhase",
  kind: "command",
  description:
    "Move a ticket to another of the organization's phases (ADR 0043). Only moves the " +
    "organization allows (ticketPhase.list transitionsTo); nothing leaves a terminal phase. The " +
    "target's flags apply: requiresReason needs `reason`, requiresAssignee needs a main assignee " +
    "(assignment.assign), and a terminal phase releases every line. A refused move changes " +
    "nothing and gives CONFLICT with every blocker in `issues`.",
  input: TicketChangePhaseInputSchema,
  output: TicketSchema,
  permission: "ticket:write",
  handler: async ({ input: { ticketId, phaseId, reason }, context }) => {
    const before = await loadTicket({ context, id: ticketId });
    if (!before) return notFound({ entity: "Ticket" });
    const to = await context.db.ticketPhase.findFirst({ where: { id: phaseId } });
    if (!to) {
      const message = "Unknown or archived phase";
      return invalid({ message, issues: [{ path: "phaseId", message }] });
    }
    return moveTicket({ context, before, to, reason });
  },
});
