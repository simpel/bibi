"use client";

import type { NotificationDto } from "@bibi/core/schemas";
import {
  Avatar,
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

/** What happened, first and largest: who did it, then the sentence. */
function NotificationMessage({ notification }: { notification: NotificationDto }) {
  const t = useTranslations("notifications");
  const { message } = useNotificationText()({ notification });
  const actor = notification.data.actorName ?? t("someone");
  return (
    <section className="grid gap-3 rounded-lg border border-l-4 border-l-primary bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Avatar name={actor} size="sm" />
        <span className="font-medium text-foreground">{actor}</span>
      </div>
      <p className="text-xl leading-snug font-medium">{message}</p>
    </section>
  );
}

/** Kind and when, as stat cards. */
function NotificationStats({ notification }: { notification: NotificationDto }) {
  const t = useTranslations("notifications");
  const dates = useDateTimeFormat();
  const instant = new Date(notification.createdAt);
  return (
    <StatCards>
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
 * One notification in a side sheet (ADR 0094): what happened first and largest (who did it and
 * the sentence), its kind and when as stat cards, and the ticket or work order it is about as the
 * buttons that open them. Nothing shows twice. Opening it marked it read; the sheet can mark it unread or delete it.
 */
export function NotificationSheet({ notification, onClose, ...actions }: NotificationSheetProps) {
  const t = useTranslations("notifications");
  const text = useNotificationText();
  return (
    <Sheet open={notification !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <SheetContent className="w-full gap-6 overflow-y-auto sm:max-w-lg">
        {notification ? (
          <>
            <SheetHeader>
              <SheetTitle className="pr-8">{t("sheet.title")}</SheetTitle>
              <SheetDescription className="sr-only">
                {text({ notification }).message}
              </SheetDescription>
            </SheetHeader>
            <div className="grid flex-1 content-start gap-4">
              <NotificationMessage notification={notification} />
              <NotificationStats notification={notification} />
            </div>
            <NotificationActions notification={notification} {...actions} />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
