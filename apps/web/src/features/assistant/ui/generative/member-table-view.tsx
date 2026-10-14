"use client";

import { Link } from "@okazi/i18n/navigation";
import {
  Badge,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type MemberTableViewProps = GenerativeProps<"member-table">;

/** A page of staff members with their roles. */
export function MemberTableView({ items, nextCursor }: MemberTableViewProps) {
  const t = useTranslations("member");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="member-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.roles")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">
                <Link href={ROUTES.settingsMembers} className="hover:underline">
                  {member.name}
                </Link>
                <span className="block text-xs font-normal text-muted-foreground">
                  {member.email}
                </span>
              </TableCell>
              <TableCell>
                <ul className="flex flex-wrap gap-1">
                  {member.roles.map((role) => (
                    <li key={role}>
                      <Badge variant="secondary">{role}</Badge>
                    </li>
                  ))}
                </ul>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
