import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";

type Context = Pick<OperationContext, "db" | "recordChange">;

export type LinkTasksInput = {
  context: Context;
  orderId: string;
  /** The order's customer: every task must be of it. */
  customerId: string;
  taskIds: readonly string[];
  /** The input field of the task at `index`, e.g. `taskIds.0`. */
  pathOf: (index: number) => string;
};

type Found = { id: string; customerId: string; orderId: string | null };

function issuesOf({ input, found }: { input: LinkTasksInput; found: Map<string, Found> }) {
  const invalidIssues: AppErrorIssue[] = [];
  const linked: AppErrorIssue[] = [];
  input.taskIds.forEach((id, index) => {
    const path = input.pathOf(index);
    const task = found.get(id);
    if (!task) invalidIssues.push({ path, message: "Unknown task" });
    else if (task.customerId !== input.customerId)
      invalidIssues.push({ path, message: "The task is for another customer" });
    else if (task.orderId) linked.push({ path, message: "The task is already linked to an order" });
  });
  return { invalidIssues, linked };
}

/**
 * Links tasks to an order once (ADR 0117): each must be an active task of the order's customer
 * (`VALIDATION`) that has no order yet (`CONFLICT`). The write is guarded on `orderId: null`, so
 * a concurrent link that won makes this one `CONFLICT` too. Audited per task.
 */
export async function linkTasks({ ...input }: LinkTasksInput): Promise<Result<true>> {
  const { context, orderId, taskIds } = input;
  if (taskIds.length === 0) return ok({ value: true });
  const rows = await context.db.task.findMany({
    where: { id: { in: [...taskIds] } },
    select: { id: true, customerId: true, orderId: true },
  });
  const { invalidIssues, linked } = issuesOf({ input, found: new Map(rows.map((r) => [r.id, r])) });
  if (invalidIssues.length > 0)
    return invalid({
      message: invalidIssues[0]?.message ?? "Invalid tasks",
      issues: invalidIssues,
    });
  if (linked.length > 0) return conflict({ message: "Already linked to an order", issues: linked });
  const unique = [...new Set(taskIds)];
  const { count } = await context.db.task.updateMany({
    where: { id: { in: unique }, orderId: null },
    data: { orderId },
  });
  if (count !== unique.length) return conflict({ message: "A task was linked meanwhile" });
  for (const id of unique) {
    context.recordChange({
      entityType: "task",
      entityId: id,
      before: { orderId: null },
      after: { orderId },
    });
  }
  return ok({ value: true });
}

/** The order to link: an active order of the organization (`VALIDATION` at `path`). */
export async function loadLinkableOrder({
  context,
  orderId,
  path,
}: {
  context: Pick<OperationContext, "db">;
  orderId: string;
  path: string;
}): Promise<Result<{ id: string; customerId: string }>> {
  const order = await context.db.order.findFirst({
    where: { id: orderId },
    select: { id: true, customerId: true },
  });
  if (order) return ok({ value: order });
  const message = "Unknown or archived order";
  return invalid({ message, issues: [{ path, message }] });
}
