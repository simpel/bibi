"use client";

import { Card } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useInvitationColumns } from "@/features/member/ui/use-invitation-columns";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type InvitationTableViewProps = GenerativeProps<"invitation-table">;

/** A page of pending invitations with the roles they give. */
export function InvitationTableView({ items, nextCursor }: InvitationTableViewProps) {
  const t = useTranslations("member");
  const columns = useInvitationColumns<(typeof items)[number]>({ linkNames: true });
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noInvitations")}</p>;
  }
  return (
    <Card data-slot="invitation-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="invitation"
        columns={columns}
        data={items}
        getRowId={(invitation) => invitation.id}
        emptyText={t("noInvitations")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
