import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { invalid, notFound } from "../../shared/errors";
import { loadAllTicketStatuses, loadTicketStatus } from "./load-ticket-status";
import {
  TicketStatusSetGatesInputSchema,
  TicketStatusSetTransitionsInputSchema,
} from "./move-schema";
import { replaceGates } from "./replace-gates";
import { replaceTransitions } from "./replace-transitions";
import {
  TicketStatusListOutputSchema,
  TicketStatusReorderInputSchema,
  TicketStatusSchema,
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

const problem = ({ message, path = "toStatusIds" }: { message: string; path?: string }) =>
  invalid({ message, issues: [{ path, message }] });

export const setTicketStatusTransitions = defineOperation({
  name: "ticketStatus.setTransitions",
  kind: "command",
  description:
    "Set where a ticket may move from one status (ADR 0076). `allowedNext` ANY lets it move to " +
    "any status (the default); ONLY_THESE restricts it to `toStatusIds` (an empty list makes the " +
    "status a dead end). A closing status is always a dead end (ADR 0043). Gates on the moves " +
    "are set with ticketStatus.setGates.",
  input: TicketStatusSetTransitionsInputSchema,
  output: TicketStatusSchema,
  permission: "pipeline:write",
  handler: async ({ input: { id, allowedNext, toStatusIds }, context }) => {
    const before = await loadTicketStatus({ context, id });
    if (!before) return notFound({ entity: "Ticket status" });
    const targets = allowedNext === "ANY" ? null : [...new Set(toStatusIds)];
    if (before.closes && targets !== null && targets.length > 0) {
      return problem({ message: "A closing status has no moves out" });
    }
    if (targets?.includes(id)) return problem({ message: "A status cannot move to itself" });
    const found = await context.db.ticketStatus.count({ where: { id: { in: targets ?? [] } } });
    if (found !== (targets?.length ?? 0)) {
      return problem({ message: "Unknown or archived target status" });
    }
    await replaceTransitions({ context, before, targets: before.closes ? null : targets });
    const after = await loadTicketStatus({ context, id });
    if (!after) return notFound({ entity: "Ticket status" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});

export const setTicketStatusGates = defineOperation({
  name: "ticketStatus.setGates",
  kind: "command",
  description:
    "Replace the gates on moves into one status (ADR 0076). Each entry names a source status or " +
    "null for any status, and its gates (REASON needs a reason, ASSIGNEE the main assignee, " +
    "ACCEPTED_QUOTE an accepted quote). A move passes only if every gate from any status and " +
    "from its own source passes. Pass the full set.",
  input: TicketStatusSetGatesInputSchema,
  output: TicketStatusSchema,
  permission: "pipeline:write",
  handler: async ({ input: { id, gates }, context }) => {
    const before = await loadTicketStatus({ context, id });
    if (!before) return notFound({ entity: "Ticket status" });
    const sources = [...new Set(gates.flatMap(({ fromStatusId }) => fromStatusId ?? []))];
    if (sources.includes(id)) {
      return problem({ message: "A status cannot gate a move from itself", path: "gates" });
    }
    const found = await context.db.ticketStatus.count({ where: { id: { in: sources } } });
    if (found !== sources.length) {
      return problem({ message: "Unknown or archived source status", path: "gates" });
    }
    await replaceGates({ context, toStatusId: id, gates });
    const after = await loadTicketStatus({ context, id });
    if (!after) return notFound({ entity: "Ticket status" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
