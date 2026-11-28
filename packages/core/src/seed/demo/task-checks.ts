import { viewMyTasks } from "../../features/my-work/operations";
import { createExecuteContext, type ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { PRESET_PERMISSIONS } from "../../permissions/presets";
import { ALL_RECORDS } from "../../permissions/record-scope";
import type { DemoTask } from "./task-types";
import type { DemoOrg } from "./types";

export type CheckDemoTasksInput = { context: ExecuteContext; org: DemoOrg };

type TaskRow = { id: string; orderId: string | null };

type StatusInput = { org: DemoOrg; index: number; task: DemoTask; statusName: string | null };

/** A task without an order sits in its named status, else the entry status (ADR 0121). */
function statusFailures({ org, index, task, statusName }: StatusInput): string[] {
  if (task.order && statusName) return [`${org.slug}: task ${index + 1} has an order and a status`];
  if (task.order || task.doneDay !== undefined) return [];
  const wanted = task.status ?? org.pipeline.statuses.statuses.find((row) => row.entry)?.name;
  return statusName === (wanted ?? null)
    ? []
    : [`${org.slug}: task ${index + 1} is in ${statusName ?? "no status"}, expected ${wanted}`];
}

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
 * ADR 0117, 0120 (`docs/demo-seed.md`, Tasks): the organization has the data files' tasks, a
 * task with an order is linked to it and has no status while one without sits in its status
 * (ADR 0121), a done one was marked done by its assignee, an open task
 * past its due time is its assignee's `TASK_DUE` need in LATE, and each prebooked or booked room
 * of an open task has its active hold (soft or hard).
 */
export async function checkDemoTasks({ context, org }: CheckDemoTasksInput): Promise<string[]> {
  const tasks = org.tasks ?? [];
  const rows = await context.db.task.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      ...{ id: true, orderId: true, doneById: true, dueAt: true },
      orderStatus: { select: { name: true } },
    },
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
    const statusName = row.orderStatus?.name ?? null;
    failures.push(...statusFailures({ org, index, task, statusName }));
    const done = task.doneDay !== undefined;
    if (done && row.doneById !== assignee.userId)
      failures.push(`${org.slug}: task ${index + 1} was not done by ${task.assignee}`);
    if (done || !row.dueAt || row.dueAt >= now) continue;
    const assigneeId = assignee.userId;
    failures.push(...(await overdueFailures({ context, org, task: row, assigneeId })));
  }
  return [...failures, ...(await holdFailures({ context, org }))];
}

/** One active `SOFT` hold per prebooked room and one `HARD` per booked room (ADR 0120). */
async function holdFailures({ context, org }: CheckDemoTasksInput) {
  const rooms = (org.tasks ?? []).flatMap((task) =>
    task.doneDay === undefined ? (task.items ?? []) : [],
  );
  const failures: string[] = [];
  for (const [hold, kind] of [
    ["PREBOOK", "SOFT"],
    ["BOOK", "HARD"],
  ] as const) {
    const wanted = rooms.filter((room) => room.hold === hold).length;
    const held = await context.db.occupancy.count({
      where: { taskItemId: { not: null }, type: "HOLD", holdKind: kind },
    });
    if (held !== wanted)
      failures.push(`${org.slug}: ${held} ${kind} task holds, expected ${wanted}`);
  }
  return failures;
}
