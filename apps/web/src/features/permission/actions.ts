"use server";

import {
  assignMemberRole,
  type FixedRole,
  type PermissionProfile,
  type PermissionUpdateInput,
  updateApiKey,
  updatePermissions,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";
import type { SubjectType } from "./subject";

export type UpdatePermissionsActionInput = { input: PermissionUpdateInput };

/** Saves the complete override list of a member or API key. */
export async function updatePermissionsAction({
  input,
}: UpdatePermissionsActionInput): Promise<ActionResult<PermissionProfile>> {
  return toActionResult({ result: await runOperation({ operation: updatePermissions, input }) });
}

export type ChangePresetActionInput = {
  subjectType: SubjectType;
  subjectId: string;
  preset: FixedRole;
};

/**
 * Gives the member or key another preset and drops its overrides, so every permission becomes
 * what the new preset grants (`member.assignRole` or `apiKey.update`, then `permission.update`).
 */
export async function changePresetAction({
  subjectType,
  subjectId,
  preset,
}: ChangePresetActionInput): Promise<ActionResult<PermissionProfile>> {
  const changed =
    subjectType === "member"
      ? await runOperation({ operation: assignMemberRole, input: { id: subjectId, role: preset } })
      : await runOperation({ operation: updateApiKey, input: { id: subjectId, role: preset } });
  if (!changed.ok) return toActionResult({ result: changed });
  const input = { subjectType, subjectId, overrides: [] };
  return toActionResult({ result: await runOperation({ operation: updatePermissions, input }) });
}
