import { getLogger } from "@okazi/logger";
import type { AfterCommitHook } from "../operations/execute";
import type { EmbedFn } from "./embed";
import { indexEntity } from "./index-entity";

export type CreateIndexingHookInput = { embed: EmbedFn };

/**
 * After-commit hook: re-index `output.id` for commands that declare an `embeddable`.
 * Failure-safe (ADR 0030): an indexing error never changes the committed command's result. It is
 * logged as `search.index_failed` and the stale or missing row is repaired by the reindex CLI.
 */
export function createIndexingHook({ embed }: CreateIndexingHookInput): AfterCommitHook {
  return async ({ operation, output, context }) => {
    const entityId = (output as { id?: unknown } | null)?.id;
    const { embeddable } = operation;
    if (!embeddable || typeof entityId !== "string") return;
    try {
      await indexEntity({ embeddable, entityId, db: context.db, embed });
    } catch (error) {
      getLogger().error({
        event: "search.index_failed",
        operation: operation.name,
        organizationId: context.organizationId,
        entityType: embeddable.entityType,
        entityId,
        err: error,
      });
    }
  };
}
