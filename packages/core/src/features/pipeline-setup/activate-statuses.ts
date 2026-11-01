import { ok, type Result } from "../../errors/result";
import { runNested } from "../../operations/run-nested";
import type { OperationContext } from "../../operations/types";
import { archiveTicketStatus } from "../ticket-status/archive-operations";
import { loadAllTicketStatuses } from "../ticket-status/load-ticket-status";
import { reorderTicketStatuses, setTicketStatusGates } from "../ticket-status/order-operations";
import { createTicketStatus, updateTicketStatus } from "../ticket-status/write-operations";
import type { PipelineStatusDraft } from "./schema";

type StatusesInput = { context: OperationContext; statuses: readonly PipelineStatusDraft[] };

const flagsOf = ({ ticketStatus }: { ticketStatus: PipelineStatusDraft }) => ({
  color: ticketStatus.color,
  entry: ticketStatus.entry ?? false,
  closes: ticketStatus.closes ?? false,
  invoiceable: ticketStatus.invoiceable ?? false,
  event: ticketStatus.event ?? null,
});

/** Entry first, then closing statuses: no step leaves the organization without either. */
const rank = ({ ticketStatus }: { ticketStatus: PipelineStatusDraft }) =>
  ticketStatus.entry ? 0 : ticketStatus.closes ? 1 : 2;

type CreateInput = { context: OperationContext; ticketStatus: PipelineStatusDraft };

/** `ticketStatus.create` takes only a name and a colour; the draft's flags follow as an update. */
async function createWithFlags({ context, ticketStatus }: CreateInput) {
  const { name, color } = ticketStatus;
  const input = { name, color };
  const created = await runNested({ operation: createTicketStatus, input, context });
  if (!created.ok) return created;
  const flags = { id: created.value.id, ...flagsOf({ ticketStatus }) };
  return runNested({ operation: updateTicketStatus, input: flags, context });
}

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
      : await createWithFlags({ context, ticketStatus });
    if (!saved.ok) return saved;
    ids.set(ticketStatus.name, saved.value.id);
  }
  return ok({ value: ids });
}

type FinishInput = StatusesInput & { ids: Map<string, string> };

/**
 * Archives the statuses the draft left out (their tickets move to the entry status through the
 * normal move checks), then sets the draft's order and the gates on moves into each status, from any
 * status (ADR 0076). Statuses keep free movement.
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
  for (const ticketStatus of statuses) {
    const gates = [...(ticketStatus.gatesIn ?? [])];
    const input = {
      id: idOf({ name: ticketStatus.name }),
      gates: gates.length > 0 ? [{ fromStatusId: null, gates }] : [],
    };
    const set = await runNested({ operation: setTicketStatusGates, input, context });
    if (!set.ok) return set;
  }
  return ok({ value: true });
}
