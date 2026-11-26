import { ok, type Result } from "../../errors/result";
import { runNested } from "../../operations/run-nested";
import type { OperationContext } from "../../operations/types";
import { updateRecords } from "../../records/update-record";
import { initialStateOf } from "../line/line-state";
import type { LineUpdateInput } from "../line/schema";
import { recordStateChange } from "../line/state-history";
import { loadLine } from "../line/to-line-record";
import { archiveLine, updateLine } from "../line/write-operations";
import { syncAllocations } from "../line-allocation/sync-allocations";
import { updateOrder } from "../order/write-operations";
import { captureOrderVersion } from "./capture";
import { loadOrderContent, toVersionLine } from "./content";
import { changedFields } from "./diff";
import type { VersionLine } from "./schema";

type Context = OperationContext;

export type ReviveInput = { context: Context; orderId: string; lineId: string };

/**
 * Brings an archived line of the order back with its id (ADR 0116), in the state the status grid
 * gives a new line; its content is set right after, like any line's.
 */
export async function reviveLine({ context, orderId, lineId }: ReviveInput): Promise<Result<true>> {
  const row = await context.db.line.findFirst({
    where: { id: lineId, orderId, status: "ARCHIVED" },
    select: { id: true, itemId: true, stateId: true },
  });
  if (!row) return ok({ value: true });
  const stateId = await initialStateOf({ context, orderId, itemId: row.itemId });
  if (stateId !== row.stateId) {
    const fromStateId = row.stateId;
    await recordStateChange({
      context,
      lineId,
      fromStateId,
      toStateId: stateId,
      trigger: "SYSTEM",
    });
  }
  await context.db.line.update({
    where: { id: lineId, status: "ARCHIVED" },
    data: { status: "ACTIVE", stateOverridden: false },
  });
  await updateRecords({ context, ids: [lineId], change: { status: "ACTIVE" } });
  const allocated = await syncAllocations({ context, lineId });
  if (!allocated.ok) return allocated;
  const after = await loadLine({ context, id: lineId });
  context.recordChange({ entityType: "line", entityId: lineId, before: row, after });
  return ok({ value: true });
}

/** The `line.update` input that sets the line back to the version's content. */
function patchOf({ target, now }: { target: VersionLine; now: VersionLine }) {
  const fields = changedFields({ a: target, b: now }).filter((f) => f !== "alternativeGroupId");
  if (fields.length === 0) return null;
  const patch: Record<string, unknown> = { id: target.lineId };
  for (const field of fields) {
    if (field !== "fields") {
      patch[field] = target[field];
      continue;
    }
    const cleared = Object.keys(now.fields).filter((key) => !(key in target.fields));
    patch.fields = { ...target.fields, ...Object.fromEntries(cleared.map((key) => [key, null])) };
  }
  return patch as LineUpdateInput;
}

export type RestoreInput = {
  context: Context;
  version: {
    id: string;
    orderId: string;
    lines: readonly VersionLine[];
    estimatedHeadcount: number | null;
    guaranteedHeadcount: number | null;
  };
};

/**
 * Makes the order's content equal the version (ADR 0116): removes the lines it does not have,
 * brings back the ones it has that were removed, sets every line's content back, then the
 * headcounts, all through the normal commands; then captures the result as a new version.
 */
export async function restoreVersion({
  context,
  version,
}: RestoreInput): Promise<Result<{ id: string }>> {
  const { orderId } = version;
  const now = await loadOrderContent({ context, orderId });
  if (!now) return ok({ value: { id: version.id } });
  const keep = new Set(version.lines.map((line) => line.lineId));
  const extra = now.lines.filter((line) => !keep.has(line.lineId));
  const extraIds = new Set(extra.map((line) => line.lineId));
  for (const line of extra) {
    if (line.parentLineId && extraIds.has(line.parentLineId)) continue;
    const archived = await runNested({
      operation: archiveLine,
      input: { id: line.lineId },
      context,
    });
    if (!archived.ok) return archived;
  }
  const active = new Set(now.lines.map((line) => line.lineId));
  for (const target of version.lines) {
    if (!active.has(target.lineId)) {
      const revived = await reviveLine({ context, orderId, lineId: target.lineId });
      if (!revived.ok) return revived;
    }
    const current = await loadLine({ context, id: target.lineId });
    if (!current) continue;
    const input = patchOf({ target, now: toVersionLine({ line: current }) });
    if (!input) continue;
    const updated = await runNested({ operation: updateLine, input, context });
    if (!updated.ok) return updated;
  }
  const { estimatedHeadcount, guaranteedHeadcount } = version;
  if (
    now.estimatedHeadcount !== estimatedHeadcount ||
    now.guaranteedHeadcount !== guaranteedHeadcount
  ) {
    const input = { id: orderId, estimatedHeadcount, guaranteedHeadcount };
    const updated = await runNested({ operation: updateOrder, input, context });
    if (!updated.ok) return updated;
  }
  const captured = await captureOrderVersion({ context, orderId, restoredFromId: version.id });
  return ok({ value: captured ?? { id: version.id } });
}
