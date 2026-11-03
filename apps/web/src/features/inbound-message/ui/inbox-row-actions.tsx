"use client";

import { ContextMenuItem, ContextMenuSeparator } from "@bibi/ui";
import { MailCheckIcon, MailIcon, PanelRightOpenIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ticketFromMessageRoute } from "@/lib/inbox-routes";
import { Link } from "@/lib/navigation";
import type { InboxRow } from "./inbox-row";

export type InboxAbilities = {
  /** `inbox:write`: mark read or unread. */
  canWrite: boolean;
  /** `inbox:delete`. */
  canDelete: boolean;
  /** `ticket:write`: the message can become a ticket. */
  canCreateTicket: boolean;
};

type OnRow = (input: { row: InboxRow }) => void;

/** What a row can do; each handler is left out without its permission. */
export type InboxRowHandlers = {
  onSelect: OnRow;
  onToggleRead?: OnRow;
  onDelete?: OnRow;
};

export type InboxRowMenuProps = InboxRowHandlers & { row: InboxRow; canCreateTicket: boolean };

/** A row's right-click menu, the same as a notification's: open, mark read or unread, delete. */
export function InboxRowMenu({
  row,
  onSelect,
  onToggleRead,
  onDelete,
  canCreateTicket,
}: InboxRowMenuProps) {
  const t = useTranslations("inbox");
  const common = useTranslations("common");
  return (
    <>
      <ContextMenuItem onSelect={() => onSelect({ row })}>
        <PanelRightOpenIcon />
        {common("open")}
      </ContextMenuItem>
      {canCreateTicket ? (
        <ContextMenuItem asChild>
          <Link href={ticketFromMessageRoute({ id: row.id })}>
            <PlusIcon />
            {t("newTicket")}
          </Link>
        </ContextMenuItem>
      ) : null}
      <ContextMenuSeparator />
      {onToggleRead ? (
        <ContextMenuItem onSelect={() => onToggleRead({ row })}>
          {row.read ? <MailIcon /> : <MailCheckIcon />}
          {row.read ? common("markUnread") : common("markRead")}
        </ContextMenuItem>
      ) : null}
      {onDelete ? (
        <ContextMenuItem destructive onSelect={() => onDelete({ row })}>
          <Trash2Icon />
          {common("delete")}
        </ContextMenuItem>
      ) : null}
    </>
  );
}
