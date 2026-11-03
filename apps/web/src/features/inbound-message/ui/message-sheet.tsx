"use client";

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@bibi/ui";
import { ExternalLinkIcon, MailIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { inboxMessageRoute, ticketFromMessageRoute } from "@/lib/inbox-routes";
import { Link } from "@/lib/navigation";
import type { InboxRow } from "./inbox-row";
import type { InboxAbilities } from "./inbox-row-actions";
import { MessageView } from "./message-view";

export type MessageSheetProps = InboxAbilities & {
  /** The row clicked; null closes the sheet. */
  row: InboxRow | null;
  onClose: () => void;
  onMarkUnread: (input: { row: InboxRow }) => void;
  onDelete: (input: { row: InboxRow }) => void;
};

type ActionsProps = Omit<MessageSheetProps, "row" | "onClose"> & { row: InboxRow };

/** New ticket from it, its full page, mark unread and delete. */
function MessageSheetActions(props: ActionsProps) {
  const { row, canWrite, canDelete, onMarkUnread, onDelete } = props;
  const t = useTranslations("inbox");
  const common = useTranslations("common");
  return (
    <SheetFooter>
      {props.canCreateTicket ? (
        <Button asChild>
          <Link href={ticketFromMessageRoute({ id: row.id })}>
            <PlusIcon />
            {t("newTicket")}
          </Link>
        </Button>
      ) : null}
      <Button asChild variant="outline">
        <Link href={inboxMessageRoute({ id: row.id })}>
          <ExternalLinkIcon />
          {t("sheet.openPage")}
        </Link>
      </Button>
      {canWrite ? (
        <Button variant="outline" onClick={() => onMarkUnread({ row })}>
          <MailIcon />
          {common("markUnread")}
        </Button>
      ) : null}
      {canDelete ? (
        <Button variant="outline" className="text-destructive" onClick={() => onDelete({ row })}>
          <Trash2Icon />
          {common("delete")}
        </Button>
      ) : null}
    </SheetFooter>
  );
}

/**
 * One inbox message in a side sheet (ADR 0085): its subject over the message drawn the way its
 * channel looks (who and when show there, once), with a new ticket, the full page (to attach
 * it), mark unread and delete.
 */
export function MessageSheet({ row, onClose, ...actions }: MessageSheetProps) {
  const t = useTranslations("inbox");
  const message = row?.message;
  return (
    <Sheet open={row !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <SheetContent className="w-full gap-6 overflow-y-auto sm:max-w-lg">
        {row && message ? (
          <>
            <SheetHeader>
              <SheetTitle className="pr-8 text-2xl">{row.subject ?? t("noSubject")}</SheetTitle>
              <SheetDescription className="sr-only">
                {t(`channels.${row.channel}`)}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1">
              <MessageView message={message} received={row.receivedLabel} />
            </div>
            <MessageSheetActions row={row} {...actions} />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
