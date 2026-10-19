"use server";

import {
  assignMemberRole,
  cancelInvitation,
  type FixedRole,
  type InvitationDto,
  inviteMember,
  type MemberDto,
  removeMember,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type AssignMemberRoleActionInput = { id: string; role: FixedRole };

export async function assignMemberRoleAction({
  id,
  role,
}: AssignMemberRoleActionInput): Promise<ActionResult<MemberDto>> {
  return toActionResult({
    result: await runOperation({ operation: assignMemberRole, input: { id, role } }),
  });
}

export type RemoveMemberActionInput = { id: string };

export async function removeMemberAction({
  id,
}: RemoveMemberActionInput): Promise<ActionResult<MemberDto>> {
  return toActionResult({ result: await runOperation({ operation: removeMember, input: { id } }) });
}

export type InviteMemberActionInput = { email: string; role: FixedRole };

export async function inviteMemberAction({
  email,
  role,
}: InviteMemberActionInput): Promise<ActionResult<InvitationDto>> {
  return toActionResult({
    result: await runOperation({ operation: inviteMember, input: { email, role } }),
  });
}

export type CancelInvitationActionInput = { id: string };

export async function cancelInvitationAction({
  id,
}: CancelInvitationActionInput): Promise<ActionResult<InvitationDto>> {
  return toActionResult({
    result: await runOperation({ operation: cancelInvitation, input: { id } }),
  });
}
