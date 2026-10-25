import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import {
  checkMember,
  ensureMemberProfileId,
  loadMemberProfile,
  MEMBER_PROFILE_SELECT,
  toMemberProfileDto,
} from "./load-member-profile";
import {
  MemberProfileGetInputSchema,
  MemberProfileListInputSchema,
  MemberProfileListOutputSchema,
  MemberProfileSchema,
  MemberProfileSetItemsInputSchema,
  MemberProfileUpdateInputSchema,
} from "./schema";
import { checkStaffItems, replaceLinks } from "./set-items";

export const getMemberProfile = defineOperation({
  name: "memberProfile.get",
  kind: "query",
  description:
    "Read a member's work in this organization: the schedule kind (PATTERN, SHIFTS or CASUAL) and " +
    "the linked staff items, whose types are the person's positions. Defaults (PATTERN, no items) " +
    "when never saved.",
  input: MemberProfileGetInputSchema,
  output: MemberProfileSchema,
  permission: "item:read",
  handler: async ({ input: { memberId }, context }) => {
    const member = await checkMember({ context, memberId });
    if (!member.ok) return member;
    return ok({ value: await loadMemberProfile({ context, memberId }) });
  },
});

export const listMemberProfiles = defineOperation({
  name: "memberProfile.list",
  kind: "query",
  description:
    "List saved member profiles. Filter by staff items (who is behind an item) or by members. " +
    "Members whose profile was never saved are not listed (see memberProfile.get).",
  input: MemberProfileListInputSchema,
  output: MemberProfileListOutputSchema,
  permission: "item:read",
  handler: async ({ input: { itemIds, memberIds, ...page }, context }) => {
    const rows = await context.db.memberProfile.findMany({
      where: {
        ...(itemIds
          ? { items: { some: { itemId: { in: itemIds }, item: { status: "ACTIVE" } } } }
          : {}),
        ...(memberIds ? { memberId: { in: memberIds } } : {}),
      },
      select: MEMBER_PROFILE_SELECT,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      ...pageArgs(page),
    });
    const { items, nextCursor } = paginate({ rows, limit: page.limit });
    return ok({ value: { items: items.map((row) => toMemberProfileDto({ row })), nextCursor } });
  },
});

export const updateMemberProfile = defineOperation({
  name: "memberProfile.update",
  kind: "command",
  description:
    "Set how a member's working time is planned here: PATTERN (weekly hours), SHIFTS (dated " +
    "shifts only) or CASUAL (called in when needed, offered last). Advisory only: nothing is refused.",
  input: MemberProfileUpdateInputSchema,
  output: MemberProfileSchema,
  permission: "item:write",
  handler: async ({ input: { memberId, scheduleKind }, context }) => {
    const member = await checkMember({ context, memberId });
    if (!member.ok) return member;
    const before = await loadMemberProfile({ context, memberId });
    const id = await ensureMemberProfileId({ context, memberId });
    await context.db.memberProfile.update({ where: { id }, data: { scheduleKind } });
    const after = await loadMemberProfile({ context, memberId });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});

export const setMemberProfileItems = defineOperation({
  name: "memberProfile.setItems",
  kind: "command",
  description:
    "Replace the staff items linked to a member (items whose type is PERSON; their types are the " +
    "person's positions). An item links to at most one member: one linked elsewhere is a CONFLICT. " +
    "An empty list unlinks all.",
  input: MemberProfileSetItemsInputSchema,
  output: MemberProfileSchema,
  permission: "item:write",
  handler: async ({ input: { memberId, itemIds }, context }) => {
    const member = await checkMember({ context, memberId });
    if (!member.ok) return member;
    const before = await loadMemberProfile({ context, memberId });
    const unique = [...new Set(itemIds)];
    const staff = await checkStaffItems({ context, itemIds, profileId: before.id });
    if (!staff.ok) return staff;
    const id = await ensureMemberProfileId({ context, memberId });
    await replaceLinks({ context, profileId: id, itemIds: unique });
    const after = await loadMemberProfile({ context, memberId });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});

/** A member's work in the organization: schedule kind and staff items (ADR 0068). */
export const memberProfileOperations = [
  getMemberProfile,
  listMemberProfiles,
  updateMemberProfile,
  setMemberProfileItems,
];
