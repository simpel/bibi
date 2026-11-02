"use client";

import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { inboxMessageRoute, ticketFromMessageRoute } from "@/lib/inbox-routes";
import { Link } from "@/lib/navigation";
import type { InboxRow } from "./inbox-row";
import { useDismissMessage } from "./use-dismiss-message";

export type InboxRowActionsProps = {
  row: InboxRow;
  canWrite: boolean;
  /** `ticket:write`: the message can become a ticket. */
  canCreateTicket: boolean;
};

/** Open, new ticket from it, and dismiss or restore. */
export function InboxRowActions({ row, canWrite, canCreateTicket }: InboxRowActionsProps) {
  const t = useTranslations("inbox");
  const common = useTranslations("common");
  const { toggle, pending } = useDismissMessage();
  return (
    <DataTableRowActions label={common("actions")}>
      <DropdownMenuItem asChild>
        <Link href={inboxMessageRoute({ id: row.id })}>{t("open")}</Link>
      </DropdownMenuItem>
      {canCreateTicket && !row.dismissed ? (
        <DropdownMenuItem asChild>
          <Link href={ticketFromMessageRoute({ id: row.id })}>{t("newTicket")}</Link>
        </DropdownMenuItem>
      ) : null}
      {canWrite ? (
        <DropdownMenuItem
          disabled={pending}
          onSelect={() => toggle({ id: row.id, dismissed: row.dismissed })}
        >
          {row.dismissed ? t("restore") : t("dismiss")}
        </DropdownMenuItem>
      ) : null}
    </DataTableRowActions>
  );
}
