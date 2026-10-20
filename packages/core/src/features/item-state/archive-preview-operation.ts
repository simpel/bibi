import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { ArchivePreviewSchema, blockersOf } from "../../shared/archive-preview";
import { archiveState } from "./archive-state";
import { ItemStateArchiveInputSchema } from "./schema";

export const previewArchiveItemState = defineOperation({
  name: "itemState.archivePreview",
  kind: "query",
  dryRun: true,
  description:
    "Preview archiving an item state without changing anything: how many lines would move to " +
    "`targetStateId`, how many phase grid cells move or are cleared and every blocker (a missing " +
    "target, the initial state, a hard hold that would collide) that would refuse " +
    "`itemState.archive`. Same input as `itemState.archive`.",
  input: ItemStateArchiveInputSchema,
  output: ArchivePreviewSchema,
  permission: "pipeline:delete",
  handler: async ({ input, context }) => {
    const moving = await context.db.line.count({ where: { stateId: input.id } });
    const cells = await context.db.phaseStateRule.count({ where: { stateId: input.id } });
    const archived = await archiveState({ context, input });
    if (!archived.ok && archived.error.code === "NOT_FOUND") return archived;
    const blockers = archived.ok ? [] : blockersOf({ error: archived.error });
    return ok({
      value: { archivable: archived.ok, moving, cells, targetRequired: moving > 0, blockers },
    });
  },
});
