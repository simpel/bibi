import type { Prisma, Task, TaskItem } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { recordFields, WITH_RECORD_LINKS, type WithRecordLinks } from "../../records/record-links";
import { nowOf } from "../../time/now";
import { mainAssigneesOf } from "../assignment/load-assignment";
import type { TaskDto } from "./schema";

type Context = Pick<OperationContext, "db" | "permissions" | "now">;

/** The order a task's rooms are listed in, everywhere (DTO, issue paths of holds). */
export const TASK_ITEM_ORDER: Prisma.TaskItemOrderByWithRelationInput[] = [
  { createdAt: "asc" },
  { id: "asc" },
];

const TASK_ITEM_SELECT = {
  id: true,
  itemId: true,
  hold: true,
  startsAt: true,
  endsAt: true,
} as const;

/** Prisma `include` for every task read (`toTaskDtos`): its type, rooms and `LINK` values. */
export const TASK_INCLUDE = {
  ...WITH_RECORD_LINKS,
  entityType: { select: { id: true, name: true } },
  items: { select: TASK_ITEM_SELECT, orderBy: TASK_ITEM_ORDER },
} as const;

export type TaskRow = Task &
  WithRecordLinks & {
    entityType: { id: string; name: string };
    items: Pick<TaskItem, "id" | "itemId" | "hold" | "startsAt" | "endsAt">[];
  };

/** Open with a due time before `now` (ADR 0120): a task without a due time is never overdue. */
export const isOverdue = ({
  task,
  now,
}: {
  task: { doneAt: Date | null; dueAt: Date | null };
  now: Date;
}) => task.doneAt === null && task.dueAt !== null && task.dueAt < now;

/** Tasks as the API returns them: assignee and `overdue` derived, in one more query. */
export async function toTaskDtos({
  context,
  rows,
}: {
  context: Context;
  rows: readonly TaskRow[];
}): Promise<TaskDto[]> {
  const assignees = await mainAssigneesOf({ context, ids: rows.map((row) => row.id) });
  const now = nowOf({ context });
  return rows.map(({ record: _record, entityType, entityTypeId: _type, ...row }) => ({
    ...row,
    type: { id: entityType.id, name: entityType.name },
    fields: recordFields({ row: { fields: row.fields, record: _record } }),
    assigneeId: assignees.get(row.id) ?? null,
    overdue: isOverdue({ task: row, now }),
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
