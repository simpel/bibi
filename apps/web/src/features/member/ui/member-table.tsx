import type { MemberDto } from "@okazi/core";
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { AssignRolesButton } from "./assign-roles-button";

export type MemberTableProps = { members: MemberDto[]; roleNames: string[]; canAdmin: boolean };

const OWNER = "owner";

/** Staff with their roles; members holding the owner role are read-only. */
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
          <TableHead className="w-40">
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
              <ul className="flex flex-wrap gap-1">
                {member.roles.map((role) => (
                  <li key={role}>
                    <Badge variant={role === OWNER ? "outline" : "secondary"}>{role}</Badge>
                  </li>
                ))}
              </ul>
            </TableCell>
            <TableCell>
              {canAdmin && !member.roles.includes(OWNER) ? (
                <AssignRolesButton member={member} roleNames={roleNames} />
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
