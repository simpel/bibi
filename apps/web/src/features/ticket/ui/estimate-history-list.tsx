import type { DateTimeFormat, NumberFormat, TicketEstimateDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";

/** An estimate as the server (Date) or a tool result (ISO string) carries it. */
export type EstimateValue = Omit<TicketEstimateDto, "changedAt"> & { changedAt: Date | string };

export type EstimateHistoryListProps = {
  /** Oldest first, as `ticket.estimateHistory` returns them; shown newest first. */
  items: readonly EstimateValue[];
  /** The viewer's number format: `getNumberFormat()` on the server, the hook in a client card. */
  numbers: NumberFormat;
  /** The viewer's date and time format. */
  dates: DateTimeFormat;
};

/** The change against the first estimate, for a later entry that has a value. */
function deltaMinor({ items, index }: { items: readonly EstimateValue[]; index: number }) {
  const first = items[0]?.valueMinor;
  const value = items[index]?.valueMinor;
  if (index === 0 || first == null || value == null) return null;
  return value - first;
}

/** The ticket's estimated value over time (ADR 0074), newest first. Shared with the assistant. */
export function EstimateHistoryList({ items, numbers, dates }: EstimateHistoryListProps) {
  const t = useTranslations("ticket.estimateHistory");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <ol data-slot="estimate-history-list" className="divide-y">
      {items
        .map((item, index) => ({ item, delta: deltaMinor({ items, index }) }))
        .reverse()
        .map(({ item, delta }) => {
          const when = new Date(item.changedAt);
          return (
            <li key={item.id} className="flex flex-wrap items-center gap-2 py-3 text-sm">
              <span className="font-medium">
                {item.valueMinor === null
                  ? t("cleared")
                  : numbers.money({ minor: item.valueMinor })}
              </span>
              {delta ? (
                <span className="text-muted-foreground">
                  {t("sinceFirst", {
                    change: `${delta > 0 ? "+" : ""}${numbers.money({ minor: delta })}`,
                  })}
                </span>
              ) : null}
              <time className="text-xs text-muted-foreground" dateTime={when.toISOString()}>
                {dates.dateTime({ instant: when })}
              </time>
            </li>
          );
        })}
    </ol>
  );
}
