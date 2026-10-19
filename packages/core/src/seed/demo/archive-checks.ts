import { previewArchiveItemState } from "../../features/item-state/archive-preview-operation";
import { previewArchiveTicketPhase } from "../../features/ticket-phase/archive-preview-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoArchiveInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0043: previewing the removal of a phase that holds tickets, with a target, reports that
 * all of its tickets move and nothing blocks; the preview changes nothing. An organization
 * without such a phase (or state) has nothing to check.
 */
async function phaseFailures({ context, org }: CheckDemoArchiveInput): Promise<string[]> {
  const phases = await context.db.ticketPhase.findMany({
    where: { status: "ACTIVE", entry: false, terminal: false },
    include: { transitionsFrom: { include: { toPhase: true } } },
  });
  for (const phase of phases) {
    const tickets = await context.db.ticket.count({ where: { phaseId: phase.id } });
    // Tickets cannot be moved into a phase that only a quote event enters (ADR 0043).
    const target = phase.transitionsFrom.find((row) => !row.toPhase.event)?.toPhaseId;
    const templates = await context.db.ticketTemplate.count({ where: { phaseId: phase.id } });
    if (tickets === 0 || templates > 0 || !target) continue;
    const input = { id: phase.id, targetPhaseId: target };
    const result = await execute({ operation: previewArchiveTicketPhase, input, context });
    if (!result.ok) return [`${org.slug}: archive preview of ${phase.name} failed`];
    const { archivable, moving, blockers } = result.value;
    if (archivable && moving === tickets) return [];
    return [`${org.slug}: removing "${phase.name}" is blocked: ${blockers.join("; ")}`];
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

/** Removing a populated phase or state with a target is previewed and allowed (#275). */
export async function checkDemoArchive({ context, org }: CheckDemoArchiveInput): Promise<string[]> {
  const input = { context, org };
  return [...(await phaseFailures(input)), ...(await stateFailures(input))];
}
