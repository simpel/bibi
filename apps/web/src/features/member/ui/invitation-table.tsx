"use client";

import type { InvitationDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { InvitationRowActions } from "./invitation-row-actions";
import { useInvitationColumns } from "./use-invitation-columns";

export type InvitationTableProps = { invitations: InvitationDto[] };

/** Pending invitations with the roles they give and when the link expires. */
export function InvitationTable({ invitations }: InvitationTableProps) {
  const t = useTranslations("member");
  const columns = useInvitationColumns<InvitationDto>({
    renderActions: (invitation) => <InvitationRowActions invitation={invitation} />,
  });
  return (
    <PersistedDataTable
      tableId="invitation"
      columns={columns}
      data={invitations}
      getRowId={(invitation) => invitation.id}
      emptyText={t("noInvitations")}
    />
  );
}
