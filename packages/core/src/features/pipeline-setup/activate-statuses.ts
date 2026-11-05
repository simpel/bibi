import { ok, type Result } from "../../errors/result";
import { runNested } from "../../operations/run-nested";
import type { OperationContext } from "../../operations/types";
import { archiveOrderStatus } from "../order-status/archive-operations";
import { loadAllOrderStatuses } from "../order-status/load-order-status";
import { reorderOrderStatuses, setOrderStatusGates } from "../order-status/order-operations";
import { createOrderStatus, updateOrderStatus } from "../order-status/write-operations";
import type { PipelineStatusDraft } from "./schema";

type StatusesInput = { context: OperationContext; statuses: readonly PipelineStatusDraft[] };

const flagsOf = ({ orderStatus }: { orderStatus: PipelineStatusDraft }) => ({
  color: orderStatus.color,
  entry: orderStatus.entry ?? false,
  closes: orderStatus.closes ?? false,
  invoiceable: orderStatus.invoiceable ?? false,
  event: orderStatus.event ?? null,
});

/** Entry first, then closing statuses: no step leaves the organization without either. */
const rank = ({ orderStatus }: { orderStatus: PipelineStatusDraft }) =>
  orderStatus.entry ? 0 : orderStatus.closes ? 1 : 2;

type CreateInput = { context: OperationContext; orderStatus: PipelineStatusDraft };

/** `orderStatus.create` takes only a name and a colour; the draft's flags follow as an update. */
async function createWithFlags({ context, orderStatus }: CreateInput) {
  const { name, color } = orderStatus;
  const input = { name, color };
  const created = await runNested({ operation: createOrderStatus, input, context });
  if (!created.ok) return created;
  const flags = { id: created.value.id, ...flagsOf({ orderStatus }) };
  return runNested({ operation: updateOrderStatus, input: flags, context });
}

/** Creates or updates (by name) every status of the draft; returns their ids by name. */
export async function upsertStatuses({
  context,
  statuses,
}: StatusesInput): Promise<Result<Map<string, string>>> {
  const existing = await loadAllOrderStatuses({ context });
  const ordered = [...statuses].sort(
    (a, b) => rank({ orderStatus: a }) - rank({ orderStatus: b }),
  );
  const ids = new Map<string, string>();
  for (const orderStatus of ordered) {
    const found = existing.find((row) => row.name === orderStatus.name);
    const saved = found
      ? await runNested({
          operation: updateOrderStatus,
          input: { id: found.id, ...flagsOf({ orderStatus }) },
          context,
        })
      : await createWithFlags({ context, orderStatus });
    if (!saved.ok) return saved;
    ids.set(orderStatus.name, saved.value.id);
  }
  return ok({ value: ids });
}

type FinishInput = StatusesInput & { ids: Map<string, string> };

/**
 * Archives the statuses the draft left out (their orders move to the entry status through the
 * normal move checks), then sets the draft's order and the gates on moves into each status, from any
 * status (ADR 0076). Statuses keep free movement.
 */
export async function finishStatuses({
  context,
  statuses,
  ids,
}: FinishInput): Promise<Result<true>> {
  const idOf = ({ name }: { name: string }) => ids.get(name) ?? "";
  const entry = statuses.find((orderStatus) => orderStatus.entry);
  const targetStatusId = entry ? idOf({ name: entry.name }) : undefined;
  const existing = await loadAllOrderStatuses({ context });
  const kept = new Set(ids.values());
  for (const row of existing.filter((candidate) => !kept.has(candidate.id))) {
    const input = { id: row.id, ...(targetStatusId ? { targetStatusId } : {}) };
    const archived = await runNested({ operation: archiveOrderStatus, input, context });
    if (!archived.ok) return archived;
  }
  const order = { ids: statuses.map((orderStatus) => idOf({ name: orderStatus.name })) };
  const reordered = await runNested({ operation: reorderOrderStatuses, input: order, context });
  if (!reordered.ok) return reordered;
  for (const orderStatus of statuses) {
    const gates = [...(orderStatus.gatesIn ?? [])];
    const input = {
      id: idOf({ name: orderStatus.name }),
      gates: gates.length > 0 ? [{ fromStatusId: null, gates }] : [],
    };
    const set = await runNested({ operation: setOrderStatusGates, input, context });
    if (!set.ok) return set;
  }
  return ok({ value: true });
}
