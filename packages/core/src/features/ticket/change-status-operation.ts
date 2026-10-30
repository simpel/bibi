import { defineOperation } from "../../operations/define-operation";
import { invalid, notFound } from "../../shared/errors";
import { moveTicket } from "./move-ticket";
import { TicketChangeStatusInputSchema, TicketSchema } from "./schema";
import { loadTicket } from "./to-ticket-dto";

export const changeTicketStatus = defineOperation({
  name: "ticket.changeStatus",
  kind: "command",
  description:
    "Move a ticket to another of the organization's statuses (ADR 0043). Only moves the " +
    "organization allows (ticketStatus.list transitionsTo); nothing leaves a closing status. The " +
    "transition's gates apply (ticketStatus.list transitionGates): REASON needs `reason`, " +
    "ASSIGNEE a main assignee (assignment.assign), ACCEPTED_QUOTE an accepted quote; a closing " +
    "status releases every line. A refused move changes " +
    "nothing and gives CONFLICT with every blocker in `issues`.",
  input: TicketChangeStatusInputSchema,
  output: TicketSchema,
  permission: "ticket:write",
  handler: async ({ input: { ticketId, statusId, reason }, context }) => {
    const before = await loadTicket({ context, id: ticketId });
    if (!before) return notFound({ entity: "Ticket" });
    const to = await context.db.ticketStatus.findFirst({ where: { id: statusId } });
    if (!to) {
      const message = "Unknown or archived status";
      return invalid({ message, issues: [{ path: "statusId", message }] });
    }
    return moveTicket({ context, before, to, reason, trigger: "MANUAL" });
  },
});
