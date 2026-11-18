"use server";

import {
  type AssignmentAssignInput,
  type AssignmentDto,
  type AssignmentFollowInput,
  appError,
  assignAssignment,
  followAssignment,
  unfollowAssignment,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { getSessionState } from "@/server/session";
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

export type UnfollowOrderActionInput = { orderId: string };

/** The signed-in member stops following an order, e.g. from the bell on a My work card. */
export async function unfollowOrderAction({
  orderId,
}: UnfollowOrderActionInput): Promise<ActionResult<AssignmentDto>> {
  const state = await getSessionState();
  if (state.status !== "ready") {
    const error = appError({ code: "UNAUTHENTICATED", message: "Not signed in" });
    return toActionResult({ result: { ok: false, error } });
  }
  const userId = state.session.user.id;
  const input = { subjectType: "ORDER" as const, subjectId: orderId, userId };
  return toActionResult({ result: await runOperation({ operation: unfollowAssignment, input }) });
}
