import {
  defineDeleteOperation,
  defineRestoreOperation,
} from "../../archive/define-lifecycle-operations";
import { taskKind } from "./deletion-kind";
import { getTask } from "./operations";
import { TaskIdInputSchema } from "./schema";

export const restoreTask = defineRestoreOperation({
  name: "task.restore",
  description:
    "Restore an archived task: it is active again. CONFLICT when it is not archived " +
    "or its customer or contact is archived.",
  permission: "task:delete",
  kind: taskKind,
  input: TaskIdInputSchema,
  get: getTask,
});

export const deleteTask = defineDeleteOperation({
  name: "task.delete",
  description:
    "Delete an archived task permanently (ADR 0118), with its notifications. An active task is " +
    "CONFLICT: archive it first. Archived tasks are also deleted after the organization's " +
    "retention period.",
  permission: "task:delete",
  kind: taskKind,
  input: TaskIdInputSchema,
});
