import { previewArchiveItemState } from "../../features/item-state/archive-preview-operation";
import { previewArchiveTicketStatus } from "../../features/ticket-status/archive-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoArchiveInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0043: previewing the removal of a status that holds tickets, with a target, reports that
 * all of its tickets move and nothing blocks; the preview changes nothing. An organization
 * without such a status (or state) has nothing to check.
 */
async function statusFailures({ context, org }: CheckDemoArchiveInput): Promise<string[]> {
  const statuses = await context.db.ticketStatus.findMany({
    where: { status: "ACTIVE", entry: false, closes: false },
    include: { transitionsFrom: { include: { toStatus: true } } },
  });
  for (const ticketStatus of statuses) {
    const tickets = await context.db.ticket.count({ where: { statusId: ticketStatus.id } });
    // Tickets cannot be moved into a status that only a quote event enters (ADR 0043), and a
    // status that requires a reason or an accepted quote (ADR 0054) would block the move;
    // transitions come in no fixed order.
    const target = ticketStatus.transitionsFrom.find(
      ({ toStatus }) =>
        !toStatus.event && !toStatus.requiresReason && !toStatus.requiresAcceptedQuote,
    )?.toStatusId;
    const templates = await context.db.ticketTemplate.count({
      where: { statusId: ticketStatus.id },
    });
    if (tickets === 0 || templates > 0 || !target) continue;
    const input = { id: ticketStatus.id, targetStatusId: target };
    const result = await execute({ operation: previewArchiveTicketStatus, input, context });
    if (!result.ok) return [`${org.slug}: archive preview of ${ticketStatus.name} failed`];
    const { archivable, moving, blockers } = result.value;
    if (archivable && moving === tickets) return [];
    return [`${org.slug}: removing "${ticketStatus.name}" is blocked: ${blockers.join("; ")}`];
  }
  return [];
}

/** ADR 0044: the same for an item state that lines use, with another state of the type. */
async function stateFailures({ context, org }: CheckDemoArchiveInput): Promise<string[]> {
  const states = await context.db.itemState.findMany({
    where: { status: "ACTIVE", initial: false },
  });
  for (const state of states) {
    const lines = await context.db.line.count({ where: { stateId: state.id } });
    if (lines === 0) continue;
    const target = await context.db.itemState.findFirst({
      where: { entityTypeId: state.entityTypeId, initial: true },
    });
    if (!target) continue;
    const input = { id: state.id, targetStateId: target.id };
    const result = await execute({ operation: previewArchiveItemState, input, context });
    if (!result.ok) return [`${org.slug}: archive preview of ${state.name} failed`];
    if (result.value.moving === lines) return [];
    return [`${org.slug}: removing "${state.name}" would move ${result.value.moving} lines`];
  }
  return [];
}

/** Removing a populated status or state with a target is previewed and allowed (#275). */
export async function checkDemoArchive({ context, org }: CheckDemoArchiveInput): Promise<string[]> {
  const input = { context, org };
  return [...(await statusFailures(input)), ...(await stateFailures(input))];
}
