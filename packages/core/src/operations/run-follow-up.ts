import { getLogger } from "@bibi/logger";
import type { ExecuteContext } from "./context";
import type { AnyOperation } from "./types";

export type RunFollowUpInput = {
  operation: AnyOperation;
  input: unknown;
  output: unknown;
  context: ExecuteContext;
};

/** The operation's `followUp` after its commit; a failure is logged, never returned. */
export async function runFollowUp({ operation, context, ...rest }: RunFollowUpInput) {
  if (!operation.followUp) return;
  const recordChange = () => undefined;
  try {
    await operation.followUp({ ...rest, context: { ...context, recordChange } });
  } catch (error) {
    getLogger().error({
      event: "operation.followUpFailed",
      operation: operation.name,
      organizationId: context.organizationId,
      err: error,
    });
  }
}
