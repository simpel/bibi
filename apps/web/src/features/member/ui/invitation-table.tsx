"use client";

import type { InvitationDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import { CancelInvitationDialog } from "./cancel-invitation-dialog";
import { InvitationRowActions, InvitationRowMenu } from "./invitation-row-actions";
import { useInvitationColumns } from "./use-invitation-columns";

export type InvitationTableProps = { invitations: InvitationDto[] };

const ROLES = ["admin", "manager", "member"] as const;
const STATUSES: InvitationDto["status"][] = ["pending", "held"];

function useInvitationQualifiers({
  invitations,
}: {
  invitations: InvitationDto[];
}): TableQualifier<InvitationDto>[] {
  const t = useTranslations("member");
  const roles = useTranslations("role");
  const common = useTranslations("common");
  return useMemo(
    () => [
      {
        key: "role",
        label: t("columns.roles"),
        hint: ROLES.map((r) => roles(r)).join(", "),
        pick: (i) => (i.role ? roles(i.role) : undefined),
        options: ROLES.map((r) => roles(r)),
      },
      {
        key: "status",
        label: common("status"),
        hint: STATUSES.map((s) => t(`invitationStatus.${s}`)).join(", "),
        pick: (i) => t(`invitationStatus.${i.status}`),
        options: STATUSES.map((s) => t(`invitationStatus.${s}`)),
      },
      {
        key: "email",
        label: t("columns.email"),
        hint: t("columns.email"),
        pick: (i) => i.email,
        options: invitations.map((i) => i.email),
      },
    ],
    [t, roles, common, invitations],
  );
}

/** Pending invitations with the role they give, their status and when the link expires. */
export function InvitationTable({ invitations }: InvitationTableProps) {
  const t = useTranslations("member");
  const roles = useTranslations("role");
  const [revoking, setRevoking] = useState<InvitationDto | null>(null);
  const qualifiers = useInvitationQualifiers({ invitations });
  const view = useClientTableView({
    rows: invitations,
    qualifiers,
    getSearchText: (i) => `${i.email} ${i.role ? roles(i.role) : ""}`,
    totalLabel: (count) => `${count}`,
    scope: "invitations",
  });
  const columns = useInvitationColumns<InvitationDto>({
    showStatus: true,
    renderActions: (invitation) => <InvitationRowActions invitation={invitation} />,
  });
  return (
    <div className="grid gap-4">
      <TableFilterBar q={view.q} query={view.query} keys={view.keys} />
      <PersistedDataTable
        tableId="invitation"
        columns={columns}
        data={view.rows}
        getRowId={(invitation) => invitation.id}
        rowMenu={(invitation) => (
          <InvitationRowMenu invitation={invitation} onRevoke={setRevoking} />
        )}
        emptyText={t("noInvitations")}
        pagination={view.pagination}
      />
      {revoking ? (
        <CancelInvitationDialog
          invitation={revoking}
          open
          onOpenChange={(open) => !open && setRevoking(null)}
        />
      ) : null}
    </div>
  );
}
