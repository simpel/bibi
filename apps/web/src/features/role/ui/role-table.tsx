import type { RoleDto } from "@okazi/core";
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { PermissionSummary } from "./permission-summary";
import { RoleRowActions } from "./role-row-actions";

export type RoleTableProps = { roles: RoleDto[]; canAdmin: boolean };

/** Roles of the organization; the system owner role is shown read-only. */
export async function RoleTable({ roles, canAdmin }: RoleTableProps) {
  const t = await getTranslations("role");
  const common = await getTranslations("common");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.name")}</TableHead>
          <TableHead>{t("columns.permissions")}</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((role) => (
          <TableRow key={role.id}>
            <TableCell className="font-medium">
              {role.name} {role.system ? <Badge variant="outline">{t("system")}</Badge> : null}
            </TableCell>
            <TableCell>
              <PermissionSummary permissions={role.permissions} all={role.system} />
            </TableCell>
            <TableCell>
              {canAdmin && !role.system ? <RoleRowActions role={role} /> : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
