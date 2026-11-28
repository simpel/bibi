"use server";

import {
  archiveTask,
  completeTask,
  createEntityType,
  createTask,
  type EntityTypeDto,
  linkTaskOrder,
  moveTask,
  reopenTask,
  type TaskCreateInput,
  type TaskDto,
  type TaskLinkOrderInput,
  type TaskMoveInput,
  type TaskUpdateInput,
  updateTask,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateTaskActionInput = { input: TaskCreateInput };
export type UpdateTaskActionInput = { input: TaskUpdateInput };
export type TaskIdActionInput = { id: string };
export type SetTaskDoneActionInput = { id: string; done: boolean };
export type CreateTaskTypeActionInput = { name: string };
export type LinkTaskOrderActionInput = { input: TaskLinkOrderInput };
export type MoveTaskActionInput = { input: TaskMoveInput };

export async function createTaskAction({
  input,
}: CreateTaskActionInput): Promise<ActionResult<TaskDto>> {
  return toActionResult({ result: await runOperation({ operation: createTask, input }) });
}

/** Create type from the task form: a task type with just a name (`entityType.create`, base TASK). */
export async function createTaskTypeAction({
  name,
}: CreateTaskTypeActionInput): Promise<ActionResult<EntityTypeDto>> {
  return toActionResult({
    result: await runOperation({ operation: createEntityType, input: { base: "TASK", name } }),
  });
}

export async function updateTaskAction({
  input,
}: UpdateTaskActionInput): Promise<ActionResult<TaskDto>> {
  return toActionResult({ result: await runOperation({ operation: updateTask, input }) });
}

/** The checkbox: done runs `task.complete`, open again runs `task.reopen` (ADR 0117). */
export async function setTaskDoneAction({
  id,
  done,
}: SetTaskDoneActionInput): Promise<ActionResult<TaskDto>> {
  const operation = done ? completeTask : reopenTask;
  return toActionResult({ result: await runOperation({ operation, input: { id } }) });
}

export async function linkTaskOrderAction({
  input,
}: LinkTaskOrderActionInput): Promise<ActionResult<TaskDto>> {
  return toActionResult({ result: await runOperation({ operation: linkTaskOrder, input }) });
}

export async function archiveTaskAction({ id }: TaskIdActionInput): Promise<ActionResult<TaskDto>> {
  return toActionResult({ result: await runOperation({ operation: archiveTask, input: { id } }) });
}

/** A task card dropped on a pipeline column (`task.move`, ADR 0121). */
export async function moveTaskAction({
  input,
}: MoveTaskActionInput): Promise<ActionResult<TaskDto>> {
  return toActionResult({ result: await runOperation({ operation: moveTask, input }) });
}
