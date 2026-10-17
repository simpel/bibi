import type { InvitationDto } from "@okazi/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getFormatter, getTranslations } from "next-intl/server";
import { CancelInvitationButton } from "./cancel-invitation-button";
import { RoleBadge } from "./role-badge";

export type InvitationTableProps = { invitations: InvitationDto[] };

/** Pending invitations with the role they give and when the link expires. */
export async function InvitationTable({ invitations }: InvitationTableProps) {
  const t = await getTranslations("member");
  const common = await getTranslations("common");
  const format = await getFormatter();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.email")}</TableHead>
          <TableHead>{t("columns.roles")}</TableHead>
          <TableHead>{t("columns.expires")}</TableHead>
          <TableHead className="w-40">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => (
          <TableRow key={invitation.id}>
            <TableCell className="font-medium">{invitation.email}</TableCell>
            <TableCell>
              <RoleBadge role={invitation.role} />
            </TableCell>
            <TableCell>
              {format.dateTime(invitation.expiresAt, { dateStyle: "medium", timeStyle: "short" })}
            </TableCell>
            <TableCell>
              <CancelInvitationButton invitation={invitation} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
