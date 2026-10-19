import { ok, type Result } from "../../errors/result";
import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { draftFromPreset, type ExistingSetupType } from "./draft-from-templates";
import type { PipelinePresetDraftInput } from "./preset-schema";
import type { PipelineSetupDraft } from "./schema";

type Context = Pick<OperationContext, "db" | "permissions">;

export type PresetDraftInput = { context: Context; input: PipelinePresetDraftInput };

/** The organization's active item types; none for a caller without `configuration:view`. */
async function existingItemTypes({ context }: { context: Context }): Promise<ExistingSetupType[]> {
  const permission = "configuration:view";
  if (!hasPermission({ permissions: context.permissions, permission })) return [];
  const rows = await context.db.entityType.findMany({
    where: { status: "ACTIVE", base: "ITEM" },
    select: { id: true, name: true, behaviours: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    bookable: row.behaviours.includes("BOOKABLE"),
  }));
}

/**
 * A whole draft from a setup preset (ADR 0045) for the caller's organization: its active item
 * types are kept (by id), the preset adds the ones it is missing, and states, phases and the grid
 * come from the templates. Nothing is saved.
 */
export async function presetDraft({
  context,
  input,
}: PresetDraftInput): Promise<Result<PipelineSetupDraft>> {
  const existingTypes = await existingItemTypes({ context });
  return ok({ value: draftFromPreset({ key: input.key, existingTypes }) });
}
