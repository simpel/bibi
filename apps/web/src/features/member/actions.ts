"use server";

import {
  assignMemberRole,
  cancelInvitation,
  type InvitationDto,
  inviteMember,
  type MemberDto,
  removeMember,
} from "@okazi/core";
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

export type RemoveMemberActionInput = { id: string };

export async function removeMemberAction({
  id,
}: RemoveMemberActionInput): Promise<ActionResult<MemberDto>> {
  return toActionResult({ result: await runOperation({ operation: removeMember, input: { id } }) });
}

export type InviteMemberActionInput = { email: string; roles: string[] };

export async function inviteMemberAction({
  email,
  roles,
}: InviteMemberActionInput): Promise<ActionResult<InvitationDto>> {
  return toActionResult({
    result: await runOperation({ operation: inviteMember, input: { email, roles } }),
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
