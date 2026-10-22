"use server";

import {
  type AssignmentAssignInput,
  type AssignmentDto,
  type AssignmentFollowInput,
  assignAssignment,
  followAssignment,
  unfollowAssignment,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type AssignActionInput = { input: AssignmentAssignInput };
export type FollowActionInput = { input: AssignmentFollowInput };

export async function assignAction({
  input,
}: AssignActionInput): Promise<ActionResult<AssignmentDto>> {
  return toActionResult({ result: await runOperation({ operation: assignAssignment, input }) });
}

export async function followAction({
  input,
}: FollowActionInput): Promise<ActionResult<AssignmentDto>> {
  return toActionResult({ result: await runOperation({ operation: followAssignment, input }) });
}

export async function unfollowAction({
  input,
}: FollowActionInput): Promise<ActionResult<AssignmentDto>> {
  return toActionResult({ result: await runOperation({ operation: unfollowAssignment, input }) });
}
