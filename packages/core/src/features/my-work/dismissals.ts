import type { OperationContext } from "../../operations/types";
import type { MyWorkTask } from "./tasks-schema";

type Context = Pick<OperationContext, "db">;

/**
 * A task's facts (ADR 0114): its due time and the kind's own facts. The group is left out, so a
 * task moving from Soon to Late with time stays dismissed; unread messages are due "now" on every
 * read, so only their count counts. The run sheet's version is its id, already in the key.
 */
export function taskFingerprint({ task }: { task: MyWorkTask }): string {
  const due = task.kind === "UNREAD_MESSAGES" ? null : task.dueAt.toISOString();
  return JSON.stringify([due, task.count, task.amountMinor, task.otherReference, task.issueKind]);
}

type WithoutDismissedInput = { context: Context; userId: string; tasks: MyWorkTask[] };

/** The tasks the member has not dismissed, or whose facts changed since they did (ADR 0114). */
export async function withoutDismissed({
  context,
  userId,
  tasks,
}: WithoutDismissedInput): Promise<MyWorkTask[]> {
  if (tasks.length === 0) return tasks;
  const rows = await context.db.needsYouDismissal.findMany({
    where: { userId, taskKey: { in: tasks.map((task) => task.key) } },
    select: { taskKey: true, fingerprint: true },
  });
  if (rows.length === 0) return tasks;
  const dismissed = new Map(rows.map((row) => [row.taskKey, row.fingerprint]));
  return tasks.filter((task) => dismissed.get(task.key) !== taskFingerprint({ task }));
}
