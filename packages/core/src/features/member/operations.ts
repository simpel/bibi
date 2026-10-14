import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { OWNER_ROLE } from "../../permissions/resources";
import { paginate } from "../../shared/paginate";
import { checkCanGrant } from "../role/access";
import { resolveAssignedRoles } from "./assigned-roles";
import { cancelInvitation, inviteMember, listInvitations } from "./invitation-operations";
import { joinMemberRoles, memberHasRoleWhere, splitMemberRoles } from "./member-roles";
import { checkRemovable } from "./removal-guard";
import {
  MemberAssignRoleInputSchema,
  MemberListInputSchema,
  MemberListOutputSchema,
  MemberRemoveInputSchema,
  MemberSchema,
} from "./schema";
import { MEMBER_SELECT, toMemberDto } from "./to-member-dto";

const fail = ({ code, message }: { code: "NOT_FOUND" | "FORBIDDEN"; message: string }) =>
  err({ error: new AppError({ code, message }) });

export const listMembers = defineOperation({
  name: "member.list",
  kind: "query",
  description: "List the organization's staff members with their roles. Filter by role name.",
  input: MemberListInputSchema,
  output: MemberListOutputSchema,
  permission: "member:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.member.findMany({
      where: input.role ? memberHasRoleWhere({ name: input.role }) : {},
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
    "Replace a member's roles with the given role names (see role.list). The owner role cannot " +
    "be assigned or taken away, and you cannot assign more access than you have yourself.",
  input: MemberAssignRoleInputSchema,
  output: MemberSchema,
  permission: "member:admin",
  handler: async ({ input, context }) => {
    const before = await context.db.member.findFirst({
      where: { id: input.id },
      select: MEMBER_SELECT,
    });
    if (!before) return fail({ code: "NOT_FOUND", message: "Member not found" });
    if (splitMemberRoles({ role: before.role }).includes(OWNER_ROLE)) {
      return fail({ code: "FORBIDDEN", message: "The owner's roles cannot be changed" });
    }
    const granted = await resolveAssignedRoles({ context, names: input.roles });
    if (!granted.ok) return granted;
    const allowed = checkCanGrant({ context, permissions: granted.value });
    if (!allowed.ok) return allowed;
    const row = await context.db.member.update({
      where: { id: input.id },
      data: { role: joinMemberRoles({ roles: input.roles }) },
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
    "removed, only an owner removes an owner, and you cannot remove someone with more access.",
  input: MemberRemoveInputSchema,
  output: MemberSchema,
  permission: "member:admin",
  handler: async ({ input, context }) => {
    const row = await context.db.member.findFirst({
      where: { id: input.id },
      select: MEMBER_SELECT,
    });
    if (!row) return fail({ code: "NOT_FOUND", message: "Member not found" });
    const member = toMemberDto({ row });
    const removable = await checkRemovable({ context, roles: member.roles });
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
