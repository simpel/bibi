import { viewMyTasks } from "../../features/my-work/operations";
import { createExecuteContext, type ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { PRESET_PERMISSIONS } from "../../permissions/presets";
import { ALL_RECORDS } from "../../permissions/record-scope";
import type { DemoOrg } from "./types";

export type CheckDemoTasksInput = { context: ExecuteContext; org: DemoOrg };

type TaskRow = { id: string; orderId: string | null };

/** Read as `userId` (manager preset): the keys and groups of their Needs you. */
async function needsOf({ context, userId }: { context: ExecuteContext; userId: string }) {
  const own = createExecuteContext({
    organizationId: context.organizationId,
    roles: ["manager"],
    permissions: PRESET_PERMISSIONS.manager,
    preset: "manager",
    scopes: ALL_RECORDS,
    actor: { type: "user", userId },
  });
  const result = await execute({ operation: viewMyTasks, input: {}, context: own });
  return result.ok ? (result.value.tasks ?? []) : [];
}

type OverdueInput = { context: ExecuteContext; org: DemoOrg; task: TaskRow; assigneeId: string };

/** An open, overdue task is its assignee's `TASK_DUE:<taskId>` need in LATE. */
async function overdueFailures({ context, org, task, assigneeId }: OverdueInput) {
  const needs = await needsOf({ context, userId: assigneeId });
  const need = needs.find((candidate) => candidate.key === `TASK_DUE:${task.id}`);
  return need?.group === "LATE" ? [] : [`${org.slug}: overdue task ${task.id} is not LATE`];
}

/**
 * ADR 0117 (`docs/demo-seed.md`, Tasks): the organization has the data files' tasks, a task with
 * an order is linked to it, a done one was marked done by its assignee, and an open deadline past
 * its due time is its assignee's `TASK_DUE` need in LATE.
 */
export async function checkDemoTasks({ context, org }: CheckDemoTasksInput): Promise<string[]> {
  const tasks = org.tasks ?? [];
  const rows = await context.db.task.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, orderId: true, doneById: true, endsAt: true, startsAt: true },
  });
  if (rows.length !== tasks.length)
    return [`${org.slug}: ${rows.length} tasks, expected ${tasks.length}`];
  const failures: string[] = [];
  const now = context.now?.() ?? new Date();
  for (const [index, task] of tasks.entries()) {
    const row = rows[index];
    const assignee = await context.db.member.findFirst({
      where: { organizationId: context.organizationId, user: { name: task.assignee } },
      select: { userId: true },
    });
    if (!row || !assignee) return [`${org.slug}: task ${index + 1} not found`];
    if (Boolean(task.order) !== Boolean(row.orderId))
      failures.push(`${org.slug}: task ${index + 1} order link differs`);
    const done = task.doneDay !== undefined;
    if (done && row.doneById !== assignee.userId)
      failures.push(`${org.slug}: task ${index + 1} was not done by ${task.assignee}`);
    if (done || (row.endsAt ?? row.startsAt) >= now) continue;
    const assigneeId = assignee.userId;
    failures.push(...(await overdueFailures({ context, org, task: row, assigneeId })));
  }
  return failures;
}
