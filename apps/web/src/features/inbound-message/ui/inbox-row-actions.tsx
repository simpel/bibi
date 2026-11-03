"use client";

import { ContextMenuItem, DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
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

type ItemsProps = InboxRowActionsProps & {
  /** The menu's item: the actions column's dropdown or the row's right-click menu. */
  Item: typeof DropdownMenuItem | typeof ContextMenuItem;
};

/** Open, new ticket from it, and dismiss or restore, as items of either menu. */
function InboxRowItems({ row, canWrite, canCreateTicket, Item }: ItemsProps) {
  const t = useTranslations("inbox");
  const { toggle, pending } = useDismissMessage();
  return (
    <>
      <Item asChild>
        <Link href={inboxMessageRoute({ id: row.id })}>{t("open")}</Link>
      </Item>
      {canCreateTicket && !row.dismissed ? (
        <Item asChild>
          <Link href={ticketFromMessageRoute({ id: row.id })}>{t("newTicket")}</Link>
        </Item>
      ) : null}
      {canWrite ? (
        <Item disabled={pending} onSelect={() => toggle({ id: row.id, dismissed: row.dismissed })}>
          {row.dismissed ? t("restore") : t("dismiss")}
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
