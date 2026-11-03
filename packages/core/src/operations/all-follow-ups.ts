import { getLogger } from "@bibi/logger";
import type { FollowUpInput } from "./types";

type FollowUp = (args: FollowUpInput<unknown, unknown>) => Promise<void>;

/**
 * One `followUp` made of several independent steps (ADR 0092): each runs even when an earlier
 * one fails, and a failure is logged like `execute` logs a failed `followUp`.
 */
export function allFollowUps({ steps }: { steps: readonly FollowUp[] }): FollowUp {
  return async (args) => {
    for (const step of steps) {
      try {
        await step(args);
      } catch (error) {
        getLogger().error({
          event: "operation.followUpFailed",
          step: step.name,
          organizationId: args.context.organizationId,
          err: error,
        });
      }
    }
  };
}
