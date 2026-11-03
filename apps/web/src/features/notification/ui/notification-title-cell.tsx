import type { NotificationDto } from "@bibi/core/schemas";
import { cn, Shimmer } from "@bibi/ui";
import { Link } from "@/lib/navigation";
import { ticketRoute } from "@/lib/routes";
import { NotificationKindIcon } from "./notification-kind-icon";
import { UnreadDot } from "./unread-dot";

export type NotificationTitleCellProps = {
  notification: NotificationDto;
  text: { message: string; ticket: string };
  unreadLabel: string;
  /** Being marked read before its sheet opens: the sentence shimmers. */
  pending: boolean;
  onSelect: (input: { notification: NotificationDto }) => void;
};

/** The ticket in small type, a link to it when there is one (the row's click stays out). */
function TicketLine({ ticketId, ticket }: { ticketId: string | null; ticket: string }) {
  const style = "truncate text-xs text-muted-foreground";
  if (!ticketId) return <span className={style}>{ticket}</span>;
  return (
    <Link
      href={ticketRoute({ id: ticketId })}
      onClick={(event) => event.stopPropagation()}
      className={`${style} hover:underline`}
    >
      {ticket}
    </Link>
  );
}

/**
 * Inbox style: the unread dot, the kind's icon, then the ticket (a link) in small type over what
 * happened, which opens the sheet.
 */
export function NotificationTitleCell({
  notification,
  text,
  unreadLabel,
  pending,
  onSelect,
}: NotificationTitleCellProps) {
  const unread = notification.readAt === null;
  return (
    <div className="flex items-center gap-3">
      <span className="w-2 shrink-0">{unread ? <UnreadDot label={unreadLabel} /> : null}</span>
      <NotificationKindIcon kind={notification.kind} />
      <div className="grid min-w-0 gap-0.5">
        <TicketLine ticketId={notification.ticketId} ticket={text.ticket} />
        {pending ? (
          <Shimmer className="truncate font-medium">{text.message}</Shimmer>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect({ notification });
            }}
            className={cn("truncate text-left hover:underline", unread && "font-medium")}
          >
            {text.message}
          </button>
        )}
      </div>
    </div>
  );
}
