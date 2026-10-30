import type { TicketStatus } from "@bibi/db";
import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { unplaceStatus } from "../board/status-placement";
import { clearStatusCells } from "../status-grid/cell-lifecycle";
import { moveTicket } from "../ticket/move-ticket";
import { TICKET_INCLUDE, toTicketDto } from "../ticket/to-ticket-dto";
import { checkMinimumConfiguration, serializeStatusChanges } from "./flag-rules";
import { loadAllTicketStatuses, loadTicketStatus, toTicketStatusDto } from "./load-ticket-status";
import type { TicketStatusArchiveInput } from "./schema";

type MoveAllInput = {
  context: OperationContext;
  id: string;
  targetStatusId: string | undefined;
  reason: string | undefined;
};

async function loadTarget({ context, id, targetStatusId }: Omit<MoveAllInput, "reason">) {
  const target = targetStatusId
    ? await context.db.ticketStatus.findFirst({ where: { id: targetStatusId } })
    : null;
  if (target && target.id !== id) return ok({ value: target });
  const message = "Choose another active status for the status's tickets";
  return invalid({ message, issues: [{ path: "targetStatusId", message }] });
}

/**
 * Moves every active ticket out of the status into the target through the normal move checks
 * (ADR 0043). Any blocked ticket refuses the whole archive, with every blocker listed.
 */
async function moveTicketsOut({
  context,
  id,
  targetStatusId,
  reason,
}: MoveAllInput): Promise<Result<true>> {
  const rows = await context.db.ticket.findMany({
    where: { statusId: id },
    include: TICKET_INCLUDE,
  });
  if (rows.length === 0) return ok({ value: true });
  const target = await loadTarget({ context, id, targetStatusId });
  if (!target.ok) return target;
  const blockers: AppErrorIssue[] = [];
  for (const row of rows) {
    const to: TicketStatus = target.value;
    const moved = await moveTicket({
      context,
      before: toTicketDto({ row }),
      to,
      reason,
      trigger: "SYSTEM",
    });
    if (!moved.ok) blockers.push(...moved.error.issues);
  }
  if (blockers.length === 0) return ok({ value: true });
  return conflict({ message: "Some tickets cannot move to the target status", issues: blockers });
}

type DetachInput = { context: OperationContext; id: string };

/** Removes every transition into the archived status, recorded on each status it left. */
async function detachIncoming({ context, id }: DetachInput) {
  const sources = await context.db.ticketStatusTransition.findMany({
    where: { toStatusId: id },
    select: { fromStatusId: true },
  });
  const befores = await Promise.all(
    sources.map(({ fromStatusId }) => loadTicketStatus({ context, id: fromStatusId })),
  );
  await context.db.ticketStatusTransition.deleteMany({ where: { toStatusId: id } });
  for (const before of befores) {
    if (!before) continue;
    const after = { ...before, transitionsTo: before.transitionsTo.filter((to) => to !== id) };
    context.recordChange({ entityId: before.id, before, after });
  }
}

export type ArchiveStatusInput = { context: OperationContext; input: TicketStatusArchiveInput };

/**
 * The whole archive (ADR 0043): checks, ticket moves, transitions and grid cells. Shared by
 * `ticketStatus.archive` and its dry run `ticketStatus.archivePreview`.
 */
export async function archiveStatus({ context, input }: ArchiveStatusInput) {
  const { id, targetStatusId, reason } = input;
  await serializeStatusChanges({ context });
  const before = await loadTicketStatus({ context, id });
  if (!before) return notFound({ entity: "Ticket status" });
  const templates = await context.db.ticketTemplate.count({ where: { statusId: id } });
  if (templates > 0) {
    return conflict({ message: `${templates} predefined tickets start in this status` });
  }
  const statuses = await loadAllTicketStatuses({ context });
  const minimum = checkMinimumConfiguration({ statuses, id, after: null });
  if (!minimum.ok) return minimum;
  const moved = await moveTicketsOut({ context, id, targetStatusId, reason });
  if (!moved.ok) return moved;
  await detachIncoming({ context, id });
  await context.db.ticketStatusTransition.deleteMany({ where: { fromStatusId: id } });
  await clearStatusCells({ context, statusId: id });
  await unplaceStatus({ context, statusId: id });
  // An archived status gives up its quote event (ADR 0043): another status can take it.
  const data = { status: "ARCHIVED", event: null } as const;
  const row = await context.db.ticketStatus.update({ where: { id }, data });
  const after = toTicketStatusDto({ row: { ...row, transitionsFrom: [] } });
  context.recordChange({ entityId: id, before, after });
  return ok({ value: after });
}
