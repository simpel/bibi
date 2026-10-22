import { getLogger } from "@bibi/logger";
import type { AfterCommitHook, AfterCommitInput } from "./execute";

export type RunAfterCommitInput = AfterCommitInput & { hooks: readonly AfterCommitHook[] };

/** Hooks run in parallel; a failure never undoes the command but is always logged. */
export async function runAfterCommit({ hooks, ...input }: RunAfterCommitInput): Promise<void> {
  const settled = await Promise.allSettled(hooks.map((hook) => hook(input)));
  for (const outcome of settled) {
    if (outcome.status === "fulfilled") continue;
    getLogger().error({
      event: "operation.afterCommitFailed",
      operation: input.operation.name,
      organizationId: input.context.organizationId,
      err: outcome.reason,
    });
  }
}
