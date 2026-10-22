import { getLogger } from "@bibi/logger";
import type { AfterCommitHook } from "../operations/execute";
import type { AnyOperation } from "../operations/types";
import type { EmbedFn } from "./embed";
import { indexEntity } from "./index-entity";

export type CreateIndexingHookInput = { embed: EmbedFn };

type Target = { operation: AnyOperation; output: unknown };

/** What to index: the command's own output, or each step's for a change set (ADR 0049). */
async function targetsOf({ operation, output }: Target): Promise<Target[]> {
  const steps = (output as { steps?: unknown } | null)?.steps;
  if (operation.name !== "changeSet.apply" || !Array.isArray(steps)) return [{ operation, output }];
  const { findStaticOperation } = await import("../core-operations");
  return steps.flatMap((step: { operation?: string; output?: unknown }) => {
    const nested = step.operation ? findStaticOperation({ name: step.operation }) : undefined;
    return nested ? [{ operation: nested, output: step.output }] : [];
  });
}

type IndexTargetInput = Target &
  Pick<Parameters<AfterCommitHook>[0], "context"> &
  CreateIndexingHookInput;

async function indexTarget({ operation, output, context, embed }: IndexTargetInput) {
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
}

/**
 * After-commit hook: re-index `output.id` for commands that declare an `embeddable`, and for each
 * step of a change set. Failure-safe (ADR 0030): an indexing error never changes the committed
 * command's result. It is logged as `search.index_failed` and repaired by the reindex CLI.
 */
export function createIndexingHook({ embed }: CreateIndexingHookInput): AfterCommitHook {
  return async ({ operation, output, context }) => {
    for (const target of await targetsOf({ operation, output })) {
      await indexTarget({ ...target, context, embed });
    }
  };
}
