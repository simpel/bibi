import type { DateTimeFormat, TicketStatusChangeDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";

/** A status change as the server (Date) or a tool result (ISO string) carries it. */
export type StatusChangeValue = Omit<TicketStatusChangeDto, "changedAt"> & {
  changedAt: Date | string;
};

export type StatusHistoryListProps = {
  /** Oldest first, as `ticket.statusHistory` returns them; shown newest first. */
  items: readonly StatusChangeValue[];
  /** Status id → name; without it an entry says only that the status changed. */
  statusNames?: ReadonlyMap<string, string>;
  /** The viewer's date and time format: `getDateTimeFormat()` on the server, the hook in a client card. */
  dates: DateTimeFormat;
};

/**
 * The ticket's status history (ADR 0054), newest first: the status entered, what made the move,
 * when, and the reason. Shared by the ticket page and the assistant's tool card.
 */
export function StatusHistoryList({ items, statusNames, dates: format }: StatusHistoryListProps) {
  const t = useTranslations("ticket.statusHistory");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <ol data-slot="status-history-list" className="divide-y">
      {[...items].reverse().map((item) => {
        const when = new Date(item.changedAt);
        const ticketStatus = statusNames?.get(item.toStatusId);
        return (
          <li key={item.id} className="flex flex-wrap items-center gap-2 py-3 text-sm">
            <span className="font-medium">
              {ticketStatus ? t("entered", { status: ticketStatus }) : t("changed")}
            </span>
            <span className="text-muted-foreground">{t(`trigger.${item.trigger}`)}</span>
            <time className="text-xs text-muted-foreground" dateTime={when.toISOString()}>
              {format.dateTime({ instant: when })}
            </time>
            {item.reason ? (
              <span className="basis-full text-muted-foreground">{item.reason}</span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
