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
} from "@bibi/ui";
import { ClipboardListIcon, MailIcon, TicketIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { RelativeTime } from "@/components/relative-time";
import { Link } from "@/lib/navigation";
import { listItemRoute, ROUTES, ticketRoute } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { useNotificationText } from "./use-notification-text";

export type NotificationSheetProps = {
  /** The notification clicked; null closes the sheet. */
  notification: NotificationDto | null;
  onClose: () => void;
  onMarkUnread: (input: { notification: NotificationDto }) => void;
};

function Fact({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

/** Kind, ticket (a link), work order and when, from the snapshot the notification carries. */
function NotificationFacts({ notification }: { notification: NotificationDto }) {
  const t = useTranslations("notifications");
  const dates = useDateTimeFormat();
  const { ticket } = useNotificationText()({ notification });
  const { ticketId, workOrderId, data } = notification;
  return (
    <dl className="grid divide-y px-4">
      <Fact label={t("columns.kind")}>{t(`kinds.${notification.kind}`)}</Fact>
      <Fact label={t("columns.ticket")}>
        {ticketId ? (
          <Link href={ticketRoute({ id: ticketId })} className="underline">
            {ticket}
          </Link>
        ) : null}
      </Fact>
      <Fact label={t("sheet.workOrder")}>
        {workOrderId ? (
          <Link
            href={listItemRoute({ list: ROUTES.workOrders, id: workOrderId })}
            className="underline"
          >
            {data.workOrderName ?? t("aWorkOrder")}
          </Link>
        ) : null}
      </Fact>
      <Fact label={t("columns.created")}>
        {dates.dateTime({ instant: new Date(notification.createdAt) })}
      </Fact>
    </dl>
  );
}

/** Links to what the notification is about, and mark unread again. */
function NotificationLinks({
  notification,
  onMarkUnread,
}: Omit<NotificationSheetProps, "notification" | "onClose"> & { notification: NotificationDto }) {
  const t = useTranslations("notifications");
  const { ticketId, workOrderId } = notification;
  return (
    <SheetFooter>
      {ticketId ? (
        <Button asChild>
          <Link href={ticketRoute({ id: ticketId })}>
            <TicketIcon />
            {t("sheet.openTicket")}
          </Link>
        </Button>
      ) : null}
      {workOrderId ? (
        <Button asChild variant="outline">
          <Link href={listItemRoute({ list: ROUTES.workOrders, id: workOrderId })}>
            <ClipboardListIcon />
            {t("sheet.openWorkOrder")}
          </Link>
        </Button>
      ) : null}
      <Button variant="outline" onClick={() => onMarkUnread({ notification })}>
        <MailIcon />
        {t("markUnread")}
      </Button>
    </SheetFooter>
  );
}

/**
 * One notification in a side sheet (ADR 0094): what happened, its kind, ticket, work order and
 * when, with links to them. Opening it marks it read; the sheet can mark it unread again.
 */
export function NotificationSheet({ notification, onClose, onMarkUnread }: NotificationSheetProps) {
  const t = useTranslations("notifications");
  const text = useNotificationText();
  return (
    <Sheet open={notification !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        {notification ? (
          <>
            <SheetHeader>
              <SheetTitle>{text({ notification }).message}</SheetTitle>
              <SheetDescription>
                {t(`kinds.${notification.kind}`)} ·{" "}
                <RelativeTime instant={notification.createdAt} />
              </SheetDescription>
            </SheetHeader>
            <NotificationFacts notification={notification} />
            <NotificationLinks notification={notification} onMarkUnread={onMarkUnread} />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
