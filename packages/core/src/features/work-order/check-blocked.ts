import { ok, type Result } from "../../errors/result";
import { conflict } from "../../shared/errors";
import type { WorkOrderDto } from "./schema";

export type CheckNotBlockedInput = {
  workOrder: Pick<WorkOrderDto, "blocked" | "matches" | "version">;
};

/** A work order with a blocking match (an item contains a counted value) cannot be sent. */
export function checkNotBlocked({ workOrder }: CheckNotBlockedInput): Result<true> {
  if (!workOrder.blocked) return ok({ value: true });
  const hits = workOrder.matches
    .filter((match) => match.blocking)
    .map((match) => `${match.name} in ${match.lineName}`);
  return conflict({
    message: `Version ${workOrder.version} is blocked: ${hits.join(", ")} (see the work order's matches)`,
  });
}
