import type { OperationContext } from "../../operations/types";
import { joinMemberRoles, memberHasRoleWhere, splitMemberRoles } from "../member/member-roles";

export type RenameOnMembersInput = { context: OperationContext; from: string; to: string };

/** Better Auth keys member roles by name, so a rename rewrites every member holding it. */
export async function renameOnMembers({ context, from, to }: RenameOnMembersInput): Promise<void> {
  const members = await context.db.member.findMany({
    where: memberHasRoleWhere({ name: from }),
    select: { id: true, role: true },
  });
  for (const member of members) {
    const before = splitMemberRoles({ role: member.role });
    const after = before.map((name) => (name === from ? to : name));
    await context.db.member.update({
      where: { id: member.id },
      data: { role: joinMemberRoles({ roles: after }) },
    });
    context.recordChange({
      entityType: "member",
      entityId: member.id,
      before: { roles: before },
      after: { roles: after },
    });
  }
}
