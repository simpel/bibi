import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { paginate } from "../../shared/paginate";
import { cancelInvitation, inviteMember, listInvitations } from "./invitation-operations";
import { parseMemberRole } from "./member-roles";
import { checkOwnerKept, checkRemovable } from "./removal-guard";
import { checkCanGrantRole, checkCanManageMember } from "./role-access";
import {
  MemberAssignRoleInputSchema,
  MemberListInputSchema,
  MemberListOutputSchema,
  MemberRemoveInputSchema,
  MemberSchema,
} from "./schema";
import { MEMBER_SELECT, toMemberDto } from "./to-member-dto";

const notFound = () =>
  err({ error: new AppError({ code: "NOT_FOUND", message: "Member not found" }) });

export const listMembers = defineOperation({
  name: "member.list",
  kind: "query",
  description:
    "List the organization's staff members with their access role (viewer, member, admin or " +
    "owner). Filter by role.",
  input: MemberListInputSchema,
  output: MemberListOutputSchema,
  permission: "member:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.member.findMany({
      where: input.role ? { role: input.role } : {},
      select: MEMBER_SELECT,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });
    const items = rows.map((row) => toMemberDto({ row }));
    return ok({ value: paginate({ rows: items, limit: input.limit }) });
  },
});

export const assignMemberRole = defineOperation({
  name: "member.assignRole",
  kind: "command",
  description:
    "Give a member one of the fixed roles: viewer (reads), member (also writes operational " +
    "data), admin (also configuration, members and API keys) or owner (everything). You cannot " +
    "give a role above your own or change someone above you, and the last owner stays owner.",
  input: MemberAssignRoleInputSchema,
  output: MemberSchema,
  permission: "member:admin",
  handler: async ({ input, context }) => {
    const before = await context.db.member.findFirst({
      where: { id: input.id },
      select: MEMBER_SELECT,
    });
    if (!before) return notFound();
    const from = parseMemberRole({ role: before.role });
    const allowed = checkCanManageMember({ context, role: from });
    if (!allowed.ok) return allowed;
    const granted = checkCanGrantRole({ context, role: input.role });
    if (!granted.ok) return granted;
    const kept = await checkOwnerKept({ context, from, to: input.role });
    if (!kept.ok) return kept;
    const row = await context.db.member.update({
      where: { id: input.id },
      data: { role: input.role },
      select: MEMBER_SELECT,
    });
    const member = toMemberDto({ row });
    context.recordChange({
      entityId: member.id,
      before: toMemberDto({ row: before }),
      after: member,
    });
    return ok({ value: member });
  },
});

export const removeMember = defineOperation({
  name: "member.remove",
  kind: "command",
  description:
    "Remove a member from the organization; they lose access at once. The last owner cannot be " +
    "removed, only an owner removes an owner, and you cannot remove someone above your own role.",
  input: MemberRemoveInputSchema,
  output: MemberSchema,
  permission: "member:admin",
  handler: async ({ input, context }) => {
    const row = await context.db.member.findFirst({
      where: { id: input.id },
      select: MEMBER_SELECT,
    });
    if (!row) return notFound();
    const member = toMemberDto({ row });
    const removable = await checkRemovable({ context, role: member.role });
    if (!removable.ok) return removable;
    await context.db.member.delete({ where: { id: input.id } });
    context.recordChange({ entityId: member.id, before: member });
    return ok({ value: member });
  },
});

export const memberOperations = [
  listMembers,
  assignMemberRole,
  removeMember,
  inviteMember,
  listInvitations,
  cancelInvitation,
];
