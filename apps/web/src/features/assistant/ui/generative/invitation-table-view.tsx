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

export type InvitationTableViewProps = GenerativeProps<"invitation-table">;

/** A page of pending invitations with the roles they give. */
export function InvitationTableView({ items, nextCursor }: InvitationTableViewProps) {
  const t = useTranslations("member");
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noInvitations")}</p>;
  }
  return (
    <Card data-slot="invitation-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.email")}</TableHead>
            <TableHead>{t("columns.roles")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((invitation) => (
            <TableRow key={invitation.id}>
              <TableCell className="font-medium">
                <Link href={ROUTES.settingsMembers} className="hover:underline">
                  {invitation.email}
                </Link>
              </TableCell>
              <TableCell>
                <ul className="flex flex-wrap gap-1">
                  {invitation.roles.map((role) => (
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
