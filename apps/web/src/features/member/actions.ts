"use server";

import { assignMemberRole, type MemberDto } from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type AssignMemberRolesActionInput = { id: string; roles: string[] };

export async function assignMemberRolesAction({
  id,
  roles,
}: AssignMemberRolesActionInput): Promise<ActionResult<MemberDto>> {
  return toActionResult({
    result: await runOperation({ operation: assignMemberRole, input: { id, roles } }),
  });
}
