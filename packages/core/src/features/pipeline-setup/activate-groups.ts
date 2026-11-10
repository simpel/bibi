import { ok, type Result } from "../../errors/result";
import { runNested } from "../../operations/run-nested";
import type { OperationContext } from "../../operations/types";
import { createItemTypeGroup } from "../item-type-group/operations";
import type { PipelineSetupDraft } from "./schema";

export type ActivateGroupsInput = { context: OperationContext; draft: PipelineSetupDraft };

/**
 * The draft's item type groups by name (ADR 0101): an active group with the name (ignoring case)
 * is reused, any other is created through `itemTypeGroup.create`, in the order types name them.
 */
export async function activateGroups({
  context,
  draft,
}: ActivateGroupsInput): Promise<Result<Map<string, string>>> {
  const ids = new Map<string, string>();
  const existing = await context.db.itemTypeGroup.findMany({ select: { id: true, name: true } });
  for (const type of draft.itemTypes) {
    const name = type.group;
    if (!name || ids.has(name)) continue;
    const found = existing.find((group) => group.name.toLowerCase() === name.toLowerCase());
    if (found) {
      ids.set(name, found.id);
      continue;
    }
    const created = await runNested({ operation: createItemTypeGroup, input: { name }, context });
    if (!created.ok) return created;
    ids.set(name, created.value.id);
  }
  return ok({ value: ids });
}
