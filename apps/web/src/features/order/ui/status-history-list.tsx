import type { DateTimeFormat, OrderStatusChangeDto } from "@bibi/core/schemas";
import { cn } from "@bibi/ui";
import { useTranslations } from "next-intl";

/** A status change as the server (Date) or a tool result (ISO string) carries it. */
export type StatusChangeValue = Omit<OrderStatusChangeDto, "changedAt"> & {
  changedAt: Date | string;
};

export type StatusHistoryListProps = {
  /** Oldest first, as `order.statusHistory` returns them; drawn newest first, left to right. */
  items: readonly StatusChangeValue[];
  /** Status id → name; without it an entry says only that the status changed. */
  statusNames?: ReadonlyMap<string, string>;
  /** The viewer's date and time format: `getDateTimeFormat()` on the server, the hook in a client card. */
  dates: DateTimeFormat;
};

/**
 * The order's status history (ADR 0054) as a horizontal timeline, newest left: a dot per move on
 * one line, with the status entered, the date and time, what made the move and the reason.
 * The first (latest) move is the current status. Shared by the order page and the assistant's tool card.
 */
export function StatusHistoryList({ items, statusNames, dates: format }: StatusHistoryListProps) {
  const t = useTranslations("order.statusHistory");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <ol data-slot="status-history-list" className="flex overflow-x-auto pb-2">
      {[...items].reverse().map((item, index) => {
        const when = new Date(item.changedAt);
        const orderStatus = statusNames?.get(item.toStatusId);
        const last = index === items.length - 1;
        const current = index === 0;
        return (
          <li key={item.id} className="relative flex w-44 shrink-0 flex-col gap-1 pr-4 text-sm">
            {last ? null : (
              <span aria-hidden className="absolute top-1.5 right-0 left-3 h-px bg-border" />
            )}
            <span
              aria-hidden
              className={cn(
                "relative size-3 rounded-full border-2",
                current ? "border-primary bg-primary" : "border-border bg-background",
              )}
            />
            <span className={cn("mt-1 truncate", current && "font-medium")}>
              {orderStatus ?? t("changed")}
            </span>
            <time className="text-xs text-muted-foreground" dateTime={when.toISOString()}>
              {format.dateTime({ instant: when })}
            </time>
            <span className="text-xs text-muted-foreground">{t(`trigger.${item.trigger}`)}</span>
            {item.reason ? (
              <span className="line-clamp-2 text-xs text-muted-foreground" title={item.reason}>
                {item.reason}
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
