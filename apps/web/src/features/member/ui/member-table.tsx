import type { MemberDto } from "@okazi/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { AssignRolesButton } from "./assign-roles-button";
import { RemoveMemberButton } from "./remove-member-button";
import { RoleBadges } from "./role-badges";

export type MemberTableProps = { members: MemberDto[]; roleNames: string[]; canAdmin: boolean };

const OWNER = "owner";

/** Staff with their roles; members holding the owner role are read-only here. */
export async function MemberTable({ members, roleNames, canAdmin }: MemberTableProps) {
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
              <RoleBadges roles={member.roles} />
            </TableCell>
            <TableCell>
              {canAdmin && !member.roles.includes(OWNER) ? (
                <div className="flex justify-end gap-2">
                  <AssignRolesButton member={member} roleNames={roleNames} />
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
