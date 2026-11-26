import { ok, type Result } from "../errors/result";
import { updateRecords } from "../records/update-record";
import { conflict, notFound } from "../shared/errors";
import { blockedConflict } from "./blockers";
import type { KindInput, LifecycleKind } from "./lifecycle-kind";

export type RestoreArchivedInput = KindInput & { kind: LifecycleKind };

/**
 * Brings an archived record back (ADR 0118): ACTIVE again, `archivedAt` cleared, its `Record`
 * row with it. A record that is not archived is CONFLICT; one whose parent is archived is
 * CONFLICT naming it. Returns the raw row before, for the audit row.
 */
export async function restoreArchived({
  kind,
  context,
  id,
}: RestoreArchivedInput): Promise<Result<unknown>> {
  const found = await kind.find({ context, id });
  if (!found) return notFound({ entity: kind.label });
  const allowed = kind.check?.({ context, id, row: found.row });
  if (allowed && !allowed.ok) return allowed;
  if (!found.archived) return conflict({ message: `${kind.label} is not archived` });
  const blockers = (await kind.restoreBlockers?.({ context, id })) ?? [];
  if (blockers.length > 0) {
    return blockedConflict({ context, message: `${kind.label} cannot be restored`, blockers });
  }
  await kind.reactivate({ context, id });
  if (kind.record) await updateRecords({ context, ids: [id], change: { status: "ACTIVE" } });
  const after = await kind.afterRestore?.({ context, id });
  if (after && !after.ok) return after;
  return ok({ value: found.row });
}
