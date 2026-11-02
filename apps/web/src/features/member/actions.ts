"use server";

import {
  assignMemberRole,
  cancelInvitation,
  type FixedRole,
  type InvitationDto,
  inviteMember,
  listMemberProfiles,
  listMembers,
  type MemberDto,
  removeMember,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { fileUrl } from "@/lib/file-url";
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

/** A member to pick in a search: the user id filters assignments, the photo is optional. */
export type MemberOption = { userId: string; name: string; email: string; photoUrl: string | null };

export type SearchMembersActionInput = { query: string };

/**
 * Members whose name or email contains `query` (`member.list`), the first ones when it is empty,
 * with their photo here when the caller may read member profiles (`item:read`, else initials).
 */
export async function searchMembersAction({
  query,
}: SearchMembersActionInput): Promise<ActionResult<MemberOption[]>> {
  const input = { limit: 8, ...(query ? { query } : {}) };
  const result = await runOperation({ operation: listMembers, input });
  if (!result.ok) return toActionResult({ result });
  const members = result.value.items;
  const memberIds = members.map(({ id }) => id);
  const profiles = memberIds.length
    ? await runOperation({ operation: listMemberProfiles, input: { memberIds, limit: 8 } })
    : null;
  const photos = new Map(
    (profiles?.ok ? profiles.value.items : []).map(({ memberId, avatarKey }) => [
      memberId,
      avatarKey,
    ]),
  );
  const value = members.map(({ id, userId, name, email }) => {
    const key = photos.get(id);
    return { userId, name, email, photoUrl: key ? fileUrl({ key }) : null };
  });
  return toActionResult({ result: { ok: true as const, value } });
}
