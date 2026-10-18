import type { TicketPhase } from "@okazi/db";
import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { clearPhaseCells } from "../phase-grid/cell-lifecycle";
import { moveTicket } from "../ticket/move-ticket";
import { toTicketDto } from "../ticket/to-ticket-dto";
import { checkMinimumConfiguration, serializePhaseChanges } from "./flag-rules";
import { loadAllTicketPhases, loadTicketPhase, toTicketPhaseDto } from "./load-ticket-phase";
import { TicketPhaseArchiveInputSchema, TicketPhaseSchema } from "./schema";

type MoveAllInput = {
  context: OperationContext;
  id: string;
  targetPhaseId: string | undefined;
  reason: string | undefined;
};

async function loadTarget({ context, id, targetPhaseId }: Omit<MoveAllInput, "reason">) {
  const target = targetPhaseId
    ? await context.db.ticketPhase.findFirst({ where: { id: targetPhaseId } })
    : null;
  if (target && target.id !== id) return ok({ value: target });
  const message = "Choose another active phase for the phase's tickets";
  return invalid({ message, issues: [{ path: "targetPhaseId", message }] });
}

/**
 * Moves every active ticket out of the phase into the target through the normal move checks
 * (ADR 0043). Any blocked ticket refuses the whole archive, with every blocker listed.
 */
async function moveTicketsOut({
  context,
  id,
  targetPhaseId,
  reason,
}: MoveAllInput): Promise<Result<true>> {
  const rows = await context.db.ticket.findMany({ where: { phaseId: id } });
  if (rows.length === 0) return ok({ value: true });
  const target = await loadTarget({ context, id, targetPhaseId });
  if (!target.ok) return target;
  const blockers: AppErrorIssue[] = [];
  for (const row of rows) {
    const to: TicketPhase = target.value;
    const moved = await moveTicket({ context, before: toTicketDto({ row }), to, reason });
    if (!moved.ok) blockers.push(...moved.error.issues);
  }
  if (blockers.length === 0) return ok({ value: true });
  return conflict({ message: "Some tickets cannot move to the target phase", issues: blockers });
}

type DetachInput = { context: OperationContext; id: string };

/** Removes every transition into the archived phase, recorded on each phase it left. */
async function detachIncoming({ context, id }: DetachInput) {
  const sources = await context.db.ticketPhaseTransition.findMany({
    where: { toPhaseId: id },
    select: { fromPhaseId: true },
  });
  const befores = await Promise.all(
    sources.map(({ fromPhaseId }) => loadTicketPhase({ context, id: fromPhaseId })),
  );
  await context.db.ticketPhaseTransition.deleteMany({ where: { toPhaseId: id } });
  for (const before of befores) {
    if (!before) continue;
    const after = { ...before, transitionsTo: before.transitionsTo.filter((to) => to !== id) };
    context.recordChange({ entityId: before.id, before, after });
  }
}

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
  handler: async ({ input: { id, targetPhaseId, reason }, context }) => {
    await serializePhaseChanges({ context });
    const before = await loadTicketPhase({ context, id });
    if (!before) return notFound({ entity: "Ticket phase" });
    const templates = await context.db.ticketTemplate.count({ where: { phaseId: id } });
    if (templates > 0) {
      return conflict({ message: `${templates} predefined tickets start in this phase` });
    }
    const phases = await loadAllTicketPhases({ context });
    const minimum = checkMinimumConfiguration({ phases, id, after: null });
    if (!minimum.ok) return minimum;
    const moved = await moveTicketsOut({ context, id, targetPhaseId, reason });
    if (!moved.ok) return moved;
    await detachIncoming({ context, id });
    await context.db.ticketPhaseTransition.deleteMany({ where: { fromPhaseId: id } });
    await clearPhaseCells({ context, phaseId: id });
    const row = await context.db.ticketPhase.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    const after = toTicketPhaseDto({ row: { ...row, transitionsFrom: [] } });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
