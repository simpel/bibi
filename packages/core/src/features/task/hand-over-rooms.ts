import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { syncTaskHolds } from "./sync-task-holds";
import { relateTaskItems } from "./task-items";

export type HandOverRoomsInput = {
  context: Pick<OperationContext, "db" | "organizationId">;
  taskIds: readonly string[];
};

/**
 * Create order from a task (ADR 0120 decision 5): every prebooked or booked room of the tasks is
 * released from its task (it becomes related, without a window) before the order's lines are
 * written, since each one becomes a line of the order (an input line that takes it, else one
 * made from it). The room is never held twice. Runs in the order's transaction.
 */
export async function handOverTaskRooms({
  context,
  taskIds,
}: HandOverRoomsInput): Promise<Result<true>> {
  for (const taskId of new Set(taskIds)) {
    await relateTaskItems({ context, taskId });
    const released = await syncTaskHolds({ context, taskId });
    if (!released.ok) return released;
  }
  return ok({ value: true });
}
