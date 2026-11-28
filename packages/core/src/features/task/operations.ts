import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { loadTaskPage } from "./list-tasks";
import { moveTask } from "./move-operation";
import { TaskIdInputSchema, TaskListInputSchema, TaskListOutputSchema, TaskSchema } from "./schema";
import { archiveTask, completeTask, linkTaskOrder, reopenTask } from "./state-operations";
import { loadTask } from "./to-task-dto";
import { updateTask } from "./update-operation";
import { createTask } from "./write-operations";

export const listTasks = defineOperation({
  name: "task.list",
  kind: "query",
  description:
    "List tasks (ADR 0117, 0120): site visits, tastings, deadlines, notes to self; by due time, " +
    "tasks without one last. Filter by customer, linked order, assignee, pipeline status " +
    "(ADR 0121), state (open, done, " +
    "overdue) and a window on the due time (`from` inclusive, `to` exclusive; tasks without a " +
    "due time only appear without a window). Each task has `overdue` and its rooms (`items`). " +
    "`page` returns `total`.",
  input: TaskListInputSchema,
  output: TaskListOutputSchema,
  permission: "task:read",
  handler: async ({ input, context }) => ok({ value: await loadTaskPage({ context, input }) }),
});

export const getTask = defineOperation({
  name: "task.get",
  kind: "query",
  description: "Get one task by id, with its type, assignee, rooms and field values.",
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
  moveTask,
  archiveTask,
];
