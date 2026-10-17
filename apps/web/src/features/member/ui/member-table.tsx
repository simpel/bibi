import type { FixedRole, MemberDto } from "@okazi/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { canManageMember } from "../assignable-roles";
import { AssignRoleButton } from "./assign-role-button";
import { RemoveMemberButton } from "./remove-member-button";
import { RoleBadge } from "./role-badge";

export type MemberTableProps = {
  members: MemberDto[];
  /** The roles the caller may give; empty when they cannot manage members. */
  roles: FixedRole[];
  /** The caller's own role: members above it are read-only here. */
  caller: FixedRole | null;
  canAdmin: boolean;
};

/** Staff with their fixed role (ADR 0034). */
export async function MemberTable({ members, roles, caller, canAdmin }: MemberTableProps) {
  const t = await getTranslations("member");
  const common = await getTranslations("common");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.name")}</TableHead>
          <TableHead>{t("columns.email")}</TableHead>
          <TableHead>{t("columns.roles")}</TableHead>
          <TableHead className="w-56">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="font-medium">{member.name}</TableCell>
            <TableCell>{member.email}</TableCell>
            <TableCell>
              <RoleBadge role={member.role} />
            </TableCell>
            <TableCell>
              {canAdmin && canManageMember({ caller, member: member.role }) ? (
                <div className="flex justify-end gap-2">
                  <AssignRoleButton member={member} roles={roles} />
                  <RemoveMemberButton member={member} />
                </div>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
