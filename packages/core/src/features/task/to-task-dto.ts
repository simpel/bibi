import type { Task } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { recordFields, WITH_RECORD_LINKS, type WithRecordLinks } from "../../records/record-links";
import { nowOf } from "../../time/now";
import { itemBusyWarnings } from "./item-busy";
import type { TaskDto } from "./schema";

type Context = Pick<OperationContext, "db" | "permissions" | "now">;

/** Prisma `include` for every task read (`toTaskDtos`): its type and its `LINK` values. */
export const TASK_INCLUDE = {
  ...WITH_RECORD_LINKS,
  entityType: { select: { id: true, name: true, taskShape: true } },
} as const;

export type TaskRow = Task &
  WithRecordLinks & {
    entityType: { id: string; name: string; taskShape: "MEETING" | "DEADLINE" | null };
  };

/** When an open task is due: a meeting's end, a deadline's due time (ADR 0117). */
export const dueAtOf = ({ task }: { task: { startsAt: Date; endsAt: Date | null } }) =>
  task.endsAt ?? task.startsAt;

/** Open and past its end or due time. */
export const isOverdue = ({
  task,
  now,
}: {
  task: { doneAt: Date | null; startsAt: Date; endsAt: Date | null };
  now: Date;
}) => task.doneAt === null && dueAtOf({ task }) < now;

/** The main assignee of each task (ADR 0034): its stored choice without a responsibility. */
async function assigneesOf({ context, ids }: { context: Context; ids: string[] }) {
  if (ids.length === 0) return new Map<string, string | null>();
  const rows = await context.db.assignment.findMany({
    where: { recordId: { in: ids }, responsibilityId: null },
    select: { recordId: true, assigneeId: true },
  });
  return new Map(rows.map((row) => [row.recordId, row.assigneeId]));
}

/** Tasks as the API returns them: assignee, `overdue` and warnings derived in two queries. */
export async function toTaskDtos({
  context,
  rows,
}: {
  context: Context;
  rows: readonly TaskRow[];
}): Promise<TaskDto[]> {
  const ids = rows.map((row) => row.id);
  const [assignees, warnings] = await Promise.all([
    assigneesOf({ context, ids }),
    itemBusyWarnings({ context, tasks: rows }),
  ]);
  const now = nowOf({ context });
  return rows.map(({ record: _record, entityType, entityTypeId: _type, ...row }) => ({
    ...row,
    type: { id: entityType.id, name: entityType.name },
    shape: entityType.taskShape ?? (row.endsAt ? "MEETING" : "DEADLINE"),
    fields: recordFields({ row: { fields: row.fields, record: _record } }),
    assigneeId: assignees.get(row.id) ?? null,
    overdue: isOverdue({ task: row, now }),
    warnings: warnings.get(row.id) ?? [],
  }));
}

/** The active task, or null when missing, archived or in another organization. */
export async function loadTask({
  context,
  id,
}: {
  context: Context;
  id: string;
}): Promise<TaskDto | null> {
  const row = await context.db.task.findFirst({ where: { id }, include: TASK_INCLUDE });
  if (!row) return null;
  const [task] = await toTaskDtos({ context, rows: [row] });
  return task ?? null;
}
