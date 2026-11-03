"use client";

import type { NotificationDto } from "@bibi/core/schemas";
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  StatCard,
  StatCards,
} from "@bibi/ui";
import { ClipboardListIcon, MailIcon, TicketIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { listItemRoute, ROUTES, ticketRoute } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { useNotificationText } from "./use-notification-text";

type OnNotification = (input: { notification: NotificationDto }) => void;

export type NotificationSheetProps = {
  /** The notification clicked; null closes the sheet. */
  notification: NotificationDto | null;
  onClose: () => void;
  onMarkUnread: OnNotification;
  /** Opens the delete confirmation. */
  onDelete: OnNotification;
};

/** Kind and when, as stat cards. */
function NotificationStats({ notification }: { notification: NotificationDto }) {
  const t = useTranslations("notifications");
  const dates = useDateTimeFormat();
  const instant = new Date(notification.createdAt);
  return (
    <StatCards className="px-4">
      <StatCard label={t("columns.kind")} value={t(`kinds.${notification.kind}`)} />
      <StatCard
        label={t("columns.created")}
        value={dates.date({ instant })}
        hint={dates.time({ instant })}
      />
    </StatCards>
  );
}

type ActionsProps = Omit<NotificationSheetProps, "notification" | "onClose"> & {
  notification: NotificationDto;
};

/** What it is about, each named once on its own button, then mark unread and delete. */
function NotificationActions({ notification, onMarkUnread, onDelete }: ActionsProps) {
  const t = useTranslations("notifications");
  const common = useTranslations("common");
  const { ticket } = useNotificationText()({ notification });
  const { ticketId, workOrderId, data } = notification;
  return (
    <SheetFooter>
      {ticketId ? (
        <Button asChild>
          <Link href={ticketRoute({ id: ticketId })}>
            <TicketIcon />
            <span className="truncate">{ticket}</span>
          </Link>
        </Button>
      ) : null}
      {workOrderId ? (
        <Button asChild variant="outline">
          <Link href={listItemRoute({ list: ROUTES.workOrders, id: workOrderId })}>
            <ClipboardListIcon />
            <span className="truncate">{data.workOrderName ?? t("aWorkOrder")}</span>
          </Link>
        </Button>
      ) : null}
      <Button variant="outline" onClick={() => onMarkUnread({ notification })}>
        <MailIcon />
        {common("markUnread")}
      </Button>
      <Button
        variant="outline"
        className="text-destructive"
        onClick={() => onDelete({ notification })}
      >
        <Trash2Icon />
        {common("delete")}
      </Button>
    </SheetFooter>
  );
}

/**
 * One notification in a side sheet (ADR 0094): what happened as the title, its kind and when as
 * stat cards, and the ticket or work order it is about as the buttons that open them. Nothing
 * shows twice. Opening it marked it read; the sheet can mark it unread or delete it.
 */
export function NotificationSheet({ notification, onClose, ...actions }: NotificationSheetProps) {
  const t = useTranslations("notifications");
  const text = useNotificationText();
  return (
    <Sheet open={notification !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        {notification ? (
          <>
            <SheetHeader>
              <SheetTitle>{text({ notification }).message}</SheetTitle>
              <SheetDescription className="sr-only">
                {t(`kinds.${notification.kind}`)}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1">
              <NotificationStats notification={notification} />
            </div>
            <NotificationActions notification={notification} {...actions} />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
