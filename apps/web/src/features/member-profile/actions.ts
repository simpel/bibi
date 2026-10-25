"use server";

import {
  type MemberProfileDto,
  type MemberProfileSetItemsInput,
  setMemberProfileItems,
  updateMemberProfile,
} from "@bibi/core";
import type { MemberProfileUpdateInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type UpdateMemberProfileActionInput = {
  input: z.infer<typeof MemberProfileUpdateInputSchema>;
};
export type SetMemberProfileItemsActionInput = { input: MemberProfileSetItemsInput };

/** Changes how the member's working time is planned (ADR 0068). */
export async function updateMemberProfileAction({
  input,
}: UpdateMemberProfileActionInput): Promise<ActionResult<MemberProfileDto>> {
  return toActionResult({ result: await runOperation({ operation: updateMemberProfile, input }) });
}

/** Replaces the staff items linked to the member; their types are the member's positions. */
export async function setMemberProfileItemsAction({
  input,
}: SetMemberProfileItemsActionInput): Promise<ActionResult<MemberProfileDto>> {
  return toActionResult({
    result: await runOperation({ operation: setMemberProfileItems, input }),
  });
}
