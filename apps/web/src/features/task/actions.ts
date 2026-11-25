"use server";

import {
  archiveTask,
  completeTask,
  createTask,
  linkTaskOrder,
  reopenTask,
  type TaskCreateInput,
  type TaskDto,
  type TaskLinkOrderInput,
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
export type LinkTaskOrderActionInput = { input: TaskLinkOrderInput };

export async function createTaskAction({
  input,
}: CreateTaskActionInput): Promise<ActionResult<TaskDto>> {
  return toActionResult({ result: await runOperation({ operation: createTask, input }) });
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
