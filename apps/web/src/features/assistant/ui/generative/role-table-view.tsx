"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PermissionSummary } from "@/features/role/ui/permission-summary";
import { ROUTES } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type RoleTableViewProps = GenerativeProps<"role-table">;

/** A page of roles; names link to the roles settings page. */
export function RoleTableView({ items, nextCursor }: RoleTableViewProps) {
  const t = useTranslations("role");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="role-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.permissions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((role) => (
            <TableRow key={role.id}>
              <TableCell className="font-medium">
                <Link href={ROUTES.settingsRoles} className="hover:underline">
                  {role.name}
                </Link>
              </TableCell>
              <TableCell>
                <PermissionSummary permissions={role.permissions} all={role.system} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
