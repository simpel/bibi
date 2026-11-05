"use client";

import {
  ContextMenuItem,
  ContextMenuSeparator,
  DataTableRowActions,
  DropdownMenuItem,
} from "@bibi/ui";
import { MailCheckIcon, MailIcon, PanelRightOpenIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { orderFromMessageRoute } from "@/lib/inbox-routes";
import { Link, useRouter } from "@/lib/navigation";
import type { InboxRow } from "./inbox-row";

export type InboxAbilities = {
  /** `inbox:write`: mark read or unread. */
  canWrite: boolean;
  /** `inbox:delete`. */
  canDelete: boolean;
  /** `order:write`: the message can become an order. */
  canCreateOrder: boolean;
};

type OnRow = (input: { row: InboxRow }) => void;

/** What a row can do; each handler is left out without its permission. */
export type InboxRowHandlers = {
  onSelect: OnRow;
  onToggleRead?: OnRow;
  onDelete?: OnRow;
};

export type InboxRowMenuProps = InboxRowHandlers & { row: InboxRow; canCreateOrder: boolean };

/** Row actions in the right-hand `actionsColumn` of the inbox table. */
export function InboxRowActions({
  row,
  onSelect,
  onToggleRead,
  onDelete,
  canCreateOrder,
}: InboxRowMenuProps) {
  const t = useTranslations("inbox");
  const common = useTranslations("common");
  const router = useRouter();
  const primary = canCreateOrder
    ? [
        {
          label: t("newOrder"),
          icon: PlusIcon,
          onClick: () => router.push(orderFromMessageRoute({ id: row.id })),
        },
      ]
    : [{ label: common("open"), icon: PanelRightOpenIcon, onClick: () => onSelect({ row }) }];
  return (
    <DataTableRowActions label={common("actions")} primary={primary}>
      {canCreateOrder ? (
        <DropdownMenuItem onSelect={() => onSelect({ row })}>{common("open")}</DropdownMenuItem>
      ) : null}
      {onToggleRead ? (
        <DropdownMenuItem onSelect={() => onToggleRead({ row })}>
          {row.read ? common("markUnread") : common("markRead")}
        </DropdownMenuItem>
      ) : null}
      {onDelete ? (
        <DropdownMenuItem destructive onSelect={() => onDelete({ row })}>
          {common("delete")}
        </DropdownMenuItem>
      ) : null}
    </DataTableRowActions>
  );
}

/** A row's right-click menu, the same as a notification's: open, mark read or unread, delete. */
export function InboxRowMenu({
  row,
  onSelect,
  onToggleRead,
  onDelete,
  canCreateOrder,
}: InboxRowMenuProps) {
  const t = useTranslations("inbox");
  const common = useTranslations("common");
  return (
    <>
      <ContextMenuItem onSelect={() => onSelect({ row })}>
        <PanelRightOpenIcon />
        {common("open")}
      </ContextMenuItem>
      {canCreateOrder ? (
        <ContextMenuItem asChild>
          <Link href={orderFromMessageRoute({ id: row.id })}>
            <PlusIcon />
            {t("newOrder")}
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
