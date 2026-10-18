import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { invalid, notFound } from "../../shared/errors";
import { loadAllTicketPhases, loadTicketPhase } from "./load-ticket-phase";
import {
  TicketPhaseListOutputSchema,
  TicketPhaseReorderInputSchema,
  TicketPhaseSchema,
  TicketPhaseSetTransitionsInputSchema,
} from "./schema";

const reorderProblem = ({ message }: { message: string }) =>
  invalid({ message, issues: [{ path: "ids", message }] });

export const reorderTicketPhases = defineOperation({
  name: "ticketPhase.reorder",
  kind: "command",
  description:
    "Set the order of the ticket phases (the board's columns, left to right): pass every " +
    "active phase id once, in the new order.",
  input: TicketPhaseReorderInputSchema,
  output: TicketPhaseListOutputSchema,
  permission: "ticketPhase:admin",
  // Each moved phase is audited as a ticketPhase change.
  entityType: "ticketPhase",
  handler: async ({ input: { ids }, context }) => {
    const current = await loadAllTicketPhases({ context });
    const known = new Set(current.map((phase) => phase.id));
    const complete = ids.length === current.length && new Set(ids).size === ids.length;
    if (!complete || ids.some((id) => !known.has(id))) {
      return reorderProblem({ message: "List every active ticket phase exactly once" });
    }
    for (const [position, id] of ids.entries()) {
      const before = current.find((phase) => phase.id === id);
      if (!before || before.position === position) continue;
      await context.db.ticketPhase.update({ where: { id }, data: { position } });
      context.recordChange({ entityId: id, before, after: { ...before, position } });
    }
    return ok({ value: { items: await loadAllTicketPhases({ context }), nextCursor: null } });
  },
});

const problem = ({ message }: { message: string }) =>
  invalid({ message, issues: [{ path: "toPhaseIds", message }] });

export const setTicketPhaseTransitions = defineOperation({
  name: "ticketPhase.setTransitions",
  kind: "command",
  description:
    "Replace the phases a ticket may move to from one phase (from → to). Pass the full set; an " +
    "empty list makes the phase a dead end. A terminal phase is always a dead end (ADR 0043). " +
    "The phase flags still apply to every allowed move.",
  input: TicketPhaseSetTransitionsInputSchema,
  output: TicketPhaseSchema,
  permission: "ticketPhase:admin",
  handler: async ({ input: { id, toPhaseIds }, context }) => {
    const before = await loadTicketPhase({ context, id });
    if (!before) return notFound({ entity: "Ticket phase" });
    const targets = [...new Set(toPhaseIds)];
    if (before.terminal && targets.length > 0) {
      return problem({ message: "A terminal phase has no transitions out" });
    }
    if (targets.includes(id)) return problem({ message: "A phase cannot move to itself" });
    const found = await context.db.ticketPhase.count({ where: { id: { in: targets } } });
    if (found !== targets.length) return problem({ message: "Unknown or archived target phase" });
    await context.db.ticketPhaseTransition.deleteMany({ where: { fromPhaseId: id } });
    await context.db.ticketPhaseTransition.createMany({
      data: targets.map((toPhaseId) => ({
        organizationId: context.organizationId,
        fromPhaseId: id,
        toPhaseId,
      })),
    });
    const after = await loadTicketPhase({ context, id });
    if (!after) return notFound({ entity: "Ticket phase" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
