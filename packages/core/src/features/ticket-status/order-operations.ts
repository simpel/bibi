import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { invalid, notFound } from "../../shared/errors";
import { loadAllTicketStatuses, loadTicketStatus } from "./load-ticket-status";
import { replaceTransitions } from "./replace-transitions";
import {
  TicketStatusListOutputSchema,
  TicketStatusReorderInputSchema,
  TicketStatusSchema,
  TicketStatusSetTransitionsInputSchema,
} from "./schema";

const reorderProblem = ({ message }: { message: string }) =>
  invalid({ message, issues: [{ path: "ids", message }] });

export const reorderTicketStatuses = defineOperation({
  name: "ticketStatus.reorder",
  kind: "command",
  description:
    "Set the order of the ticket statuses (the board's columns, left to right): pass every " +
    "active status id once, in the new order.",
  input: TicketStatusReorderInputSchema,
  output: TicketStatusListOutputSchema,
  permission: "pipeline:write",
  // Each moved status is audited as a ticketStatus change.
  entityType: "ticketStatus",
  handler: async ({ input: { ids }, context }) => {
    const current = await loadAllTicketStatuses({ context });
    const known = new Set(current.map((ticketStatus) => ticketStatus.id));
    const complete = ids.length === current.length && new Set(ids).size === ids.length;
    if (!complete || ids.some((id) => !known.has(id))) {
      return reorderProblem({ message: "List every active ticket status exactly once" });
    }
    for (const [position, id] of ids.entries()) {
      const before = current.find((ticketStatus) => ticketStatus.id === id);
      if (!before || before.position === position) continue;
      await context.db.ticketStatus.update({ where: { id }, data: { position } });
      context.recordChange({ entityId: id, before, after: { ...before, position } });
    }
    return ok({ value: { items: await loadAllTicketStatuses({ context }), nextCursor: null } });
  },
});

const problem = ({ message }: { message: string }) =>
  invalid({ message, issues: [{ path: "toStatusIds", message }] });

export const setTicketStatusTransitions = defineOperation({
  name: "ticketStatus.setTransitions",
  kind: "command",
  description:
    "Replace the statuses a ticket may move to from one status (from → to). Pass the full set; an " +
    "empty list makes the status a dead end. A closing status is always a dead end (ADR 0043). " +
    "Each transition can carry gates a move along it must pass (REASON, ASSIGNEE, " +
    "ACCEPTED_QUOTE; ADR 0067): pass `gates` to replace them, omit it to keep the current ones.",
  input: TicketStatusSetTransitionsInputSchema,
  output: TicketStatusSchema,
  permission: "pipeline:write",
  handler: async ({ input: { id, toStatusIds, gates }, context }) => {
    const before = await loadTicketStatus({ context, id });
    if (!before) return notFound({ entity: "Ticket status" });
    const targets = [...new Set(toStatusIds)];
    if (before.closes && targets.length > 0) {
      return problem({ message: "A closing status has no transitions out" });
    }
    if (targets.includes(id)) return problem({ message: "A status cannot move to itself" });
    const found = await context.db.ticketStatus.count({ where: { id: { in: targets } } });
    if (found !== targets.length) return problem({ message: "Unknown or archived target status" });
    const replaced = await replaceTransitions({ context, before, targets, gates });
    if (!replaced.ok) return replaced;
    const after = await loadTicketStatus({ context, id });
    if (!after) return notFound({ entity: "Ticket status" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
