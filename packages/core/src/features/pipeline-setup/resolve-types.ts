import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { checkReadable } from "../ticket/ticket-rules";
import type { PipelineSetupDraft } from "./schema";

export type ResolveTypesInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  draft: PipelineSetupDraft;
};

/**
 * Whether each draft item type is bookable (by name). An existing type (`entityTypeId`) must be an
 * active item type of the organization (`NOT_FOUND` otherwise, also for another organization's id)
 * and is read with `configuration:view`; a new type is bookable when its behaviours say so.
 */
export async function resolveBookable({
  context,
  draft,
}: ResolveTypesInput): Promise<Result<Map<string, boolean>>> {
  const ids = draft.itemTypes.flatMap((type) => (type.entityTypeId ? [type.entityTypeId] : []));
  if (ids.length > 0) {
    const permission = "configuration:view";
    const readable = checkReadable({ context, permission, path: "itemTypes" });
    if (!readable.ok) return readable;
  }
  const rows = await context.db.entityType.findMany({
    where: { id: { in: ids }, base: "ITEM" },
    select: { id: true, behaviours: true },
  });
  const bookable = new Map<string, boolean>();
  for (const type of draft.itemTypes) {
    if (!type.entityTypeId) {
      bookable.set(type.name, type.behaviours?.includes("BOOKABLE") === true);
      continue;
    }
    const row = rows.find((candidate) => candidate.id === type.entityTypeId);
    if (!row) return notFound({ entity: "Item type" });
    bookable.set(type.name, row.behaviours.includes("BOOKABLE"));
  }
  return ok({ value: bookable });
}
