import { TaskSchema, TaskWarningSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of a task as tool results carry it (dates = ISO strings). */
export const TaskWireSchema = TaskSchema.extend({
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  doneAt: z.string().nullable(),
  warnings: z.array(TaskWarningSchema.extend({ startsAt: z.string(), endsAt: z.string() })),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const TaskListWireSchema = z.object({
  items: z.array(TaskWireSchema),
  nextCursor: z.string().nullable(),
});

export type TaskWire = z.infer<typeof TaskWireSchema>;

const taskList = uiEntry({
  component: "task-list",
  schema: TaskListWireSchema,
  toProps: ({ value }) => value,
});
const taskCard = uiEntry({
  component: "task-card",
  schema: TaskWireSchema,
  toProps: ({ value }) => ({ task: value }),
});

/** Tool → component for tasks around a customer (ADR 0117). */
export const TASK_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  task_list: taskList,
  task_get: taskCard,
  task_create: taskCard,
  task_update: taskCard,
  task_complete: taskCard,
  task_reopen: taskCard,
  task_linkOrder: taskCard,
  task_archive: taskCard,
};
