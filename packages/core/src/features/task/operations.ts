import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { loadTaskPage } from "./list-tasks";
import { TaskIdInputSchema, TaskListInputSchema, TaskListOutputSchema, TaskSchema } from "./schema";
import { archiveTask, completeTask, linkTaskOrder, reopenTask } from "./state-operations";
import { loadTask } from "./to-task-dto";
import { createTask, updateTask } from "./write-operations";

export const listTasks = defineOperation({
  name: "task.list",
  kind: "query",
  description:
    "List tasks around customers (ADR 0117): site visits, tastings, deadlines; by start. Filter " +
    "by customer, linked order, assignee, state (open, done, overdue) and a window: `from` keeps " +
    "tasks that end (or are due) at or after it, `to` those that start before it. Each task has " +
    "`overdue` and `warnings` (ITEM_BUSY when a meeting's item is busy). `page` returns `total`.",
  input: TaskListInputSchema,
  output: TaskListOutputSchema,
  permission: "task:read",
  handler: async ({ input, context }) => ok({ value: await loadTaskPage({ context, input }) }),
});

export const getTask = defineOperation({
  name: "task.get",
  kind: "query",
  description: "Get one task by id, with its type, assignee, field values and warnings.",
  input: TaskIdInputSchema,
  output: TaskSchema,
  permission: "task:read",
  handler: async ({ input, context }) => {
    const task = await loadTask({ context, id: input.id });
    return task ? ok({ value: task }) : notFound({ entity: "Task" });
  },
});

export const taskOperations = [
  listTasks,
  getTask,
  createTask,
  updateTask,
  completeTask,
  reopenTask,
  linkTaskOrder,
  archiveTask,
];
