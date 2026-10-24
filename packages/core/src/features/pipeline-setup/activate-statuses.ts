import { ok, type Result } from "../../errors/result";
import { runNested } from "../../operations/run-nested";
import type { OperationContext } from "../../operations/types";
import { forwardTransitions } from "../../templates/ticket-statuses/ticket-status-template";
import { archiveTicketStatus } from "../ticket-status/archive-operation";
import { loadAllTicketStatuses } from "../ticket-status/load-ticket-status";
import {
  reorderTicketStatuses,
  setTicketStatusTransitions,
} from "../ticket-status/order-operations";
import { createTicketStatus, updateTicketStatus } from "../ticket-status/write-operations";
import type { PipelineStatusDraft } from "./schema";

type StatusesInput = { context: OperationContext; statuses: readonly PipelineStatusDraft[] };

const flagsOf = ({ ticketStatus }: { ticketStatus: PipelineStatusDraft }) => ({
  color: ticketStatus.color,
  entry: ticketStatus.entry ?? false,
  closes: ticketStatus.closes ?? false,
  requiresReason: ticketStatus.requiresReason ?? false,
  requiresAssignee: ticketStatus.requiresAssignee ?? false,
  requiresAcceptedQuote: ticketStatus.requiresAcceptedQuote ?? false,
  invoiceable: ticketStatus.invoiceable ?? false,
  event: ticketStatus.event ?? null,
});

/** Entry first, then closing statuses: no step leaves the organization without either. */
const rank = ({ ticketStatus }: { ticketStatus: PipelineStatusDraft }) =>
  ticketStatus.entry ? 0 : ticketStatus.closes ? 1 : 2;

/** Creates or updates (by name) every status of the draft; returns their ids by name. */
export async function upsertStatuses({
  context,
  statuses,
}: StatusesInput): Promise<Result<Map<string, string>>> {
  const existing = await loadAllTicketStatuses({ context });
  const ordered = [...statuses].sort(
    (a, b) => rank({ ticketStatus: a }) - rank({ ticketStatus: b }),
  );
  const ids = new Map<string, string>();
  for (const ticketStatus of ordered) {
    const found = existing.find((row) => row.name === ticketStatus.name);
    const saved = found
      ? await runNested({
          operation: updateTicketStatus,
          input: { id: found.id, ...flagsOf({ ticketStatus }) },
          context,
        })
      : await runNested({
          operation: createTicketStatus,
          input: { name: ticketStatus.name, ...flagsOf({ ticketStatus }) },
          context,
        });
    if (!saved.ok) return saved;
    ids.set(ticketStatus.name, saved.value.id);
  }
  return ok({ value: ids });
}

type FinishInput = StatusesInput & { ids: Map<string, string> };

/**
 * Archives the statuses the draft left out (their tickets move to the entry status through the
 * normal move checks), then sets the draft's order and the default transitions (ADR 0043).
 */
export async function finishStatuses({
  context,
  statuses,
  ids,
}: FinishInput): Promise<Result<true>> {
  const idOf = ({ name }: { name: string }) => ids.get(name) ?? "";
  const entry = statuses.find((ticketStatus) => ticketStatus.entry);
  const targetStatusId = entry ? idOf({ name: entry.name }) : undefined;
  const existing = await loadAllTicketStatuses({ context });
  const kept = new Set(ids.values());
  for (const row of existing.filter((candidate) => !kept.has(candidate.id))) {
    const input = { id: row.id, ...(targetStatusId ? { targetStatusId } : {}) };
    const archived = await runNested({ operation: archiveTicketStatus, input, context });
    if (!archived.ok) return archived;
  }
  const order = { ids: statuses.map((ticketStatus) => idOf({ name: ticketStatus.name })) };
  const reordered = await runNested({ operation: reorderTicketStatuses, input: order, context });
  if (!reordered.ok) return reordered;
  const pairs = forwardTransitions({ statuses });
  for (const ticketStatus of statuses) {
    const toStatusIds = pairs
      .filter(([from]) => from === ticketStatus.name)
      .map(([, to]) => idOf({ name: to }));
    const input = { id: idOf({ name: ticketStatus.name }), toStatusIds };
    const set = await runNested({ operation: setTicketStatusTransitions, input, context });
    if (!set.ok) return set;
  }
  return ok({ value: true });
}
