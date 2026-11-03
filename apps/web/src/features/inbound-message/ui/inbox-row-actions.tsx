"use client";

import { ContextMenuItem, DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { inboxMessageRoute, ticketFromMessageRoute } from "@/lib/inbox-routes";
import { Link } from "@/lib/navigation";
import type { InboxRow } from "./inbox-row";
import { useReadMessage } from "./use-read-message";

export type InboxAbilities = {
  /** `inbox:write`: mark read or unread. */
  canWrite: boolean;
  /** `inbox:delete`. */
  canDelete: boolean;
  /** `ticket:write`: the message can become a ticket. */
  canCreateTicket: boolean;
};

export type InboxRowActionsProps = InboxAbilities & {
  row: InboxRow;
  /** Opens the table's delete confirmation, which outlives the menu. */
  onDelete: (row: InboxRow) => void;
};

type ItemsProps = InboxRowActionsProps & {
  /** The menu's item: the actions column's dropdown or the row's right-click menu. */
  Item: typeof DropdownMenuItem | typeof ContextMenuItem;
};

/** Open, new ticket, mark read or unread, and delete, as items of either menu. */
function InboxRowItems({ row, canWrite, canDelete, canCreateTicket, onDelete, Item }: ItemsProps) {
  const t = useTranslations("inbox");
  const { setRead, pending } = useReadMessage();
  return (
    <>
      <Item asChild>
        <Link href={inboxMessageRoute({ id: row.id })}>{t("open")}</Link>
      </Item>
      {canCreateTicket ? (
        <Item asChild>
          <Link href={ticketFromMessageRoute({ id: row.id })}>{t("newTicket")}</Link>
        </Item>
      ) : null}
      {canWrite ? (
        <Item disabled={pending} onSelect={() => setRead({ id: row.id, read: !row.read })}>
          {row.read ? t("markUnread") : t("markRead")}
        </Item>
      ) : null}
      {canDelete ? (
        <Item destructive onSelect={() => onDelete(row)}>
          {t("delete")}
        </Item>
      ) : null}
    </>
  );
}

/** The actions column's menu. */
export function InboxRowActions(props: InboxRowActionsProps) {
  const common = useTranslations("common");
  return (
    <DataTableRowActions label={common("actions")}>
      <InboxRowItems {...props} Item={DropdownMenuItem} />
    </DataTableRowActions>
  );
}

/** The same actions on right click. */
export function InboxRowMenu(props: InboxRowActionsProps) {
  return <InboxRowItems {...props} Item={ContextMenuItem} />;
}
