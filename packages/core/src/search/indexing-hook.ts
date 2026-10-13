import type { AfterCommitHook } from "../operations/execute";
import type { EmbedFn } from "./embed";
import { indexEntity } from "./index-entity";

export type CreateIndexingHookInput = { embed: EmbedFn };

/** After-commit hook: re-index `output.id` for commands that declare an `embeddable`. */
export function createIndexingHook({ embed }: CreateIndexingHookInput): AfterCommitHook {
  return async ({ operation, output, context }) => {
    const entityId = (output as { id?: unknown } | null)?.id;
    if (!operation.embeddable || typeof entityId !== "string") return;
    await indexEntity({ embeddable: operation.embeddable, entityId, db: context.db, embed });
  };
}
