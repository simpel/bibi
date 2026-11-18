"use server";

import {
  dismissMyTask,
  type MyWork,
  type MyWorkDismissTaskOutput,
  type MyWorkInput,
  type MyWorkTask,
  viewMyTasks,
  viewMyWork,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

/** The next window of the caller's timeline, read as they scroll (spec: home). */
export async function loadMyWorkAction({ from, to }: MyWorkInput): Promise<ActionResult<MyWork>> {
  return toActionResult({
    result: await runOperation({ operation: viewMyWork, input: { from, to } }),
  });
}

/** Needs you again, for the notification panel while it is open (spec: home). */
export async function loadNeedsYouAction(): Promise<ActionResult<MyWorkTask[] | null>> {
  const result = await runOperation({ operation: viewMyTasks, input: {} });
  return result.ok ? { ok: true, value: result.value.tasks } : toActionResult({ result });
}

/** Dismisses one Needs you task for the caller, until its facts change (ADR 0114). */
export async function dismissNeedsYouTaskAction({
  key,
}: {
  key: string;
}): Promise<ActionResult<MyWorkDismissTaskOutput>> {
  const result = await runOperation({ operation: dismissMyTask, input: { key } });
  return toActionResult({ result });
}
