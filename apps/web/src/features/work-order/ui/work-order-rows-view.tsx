import type { DateTimeFormat, WorkOrderChange, WorkOrderContent } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { WorkOrderRowLine } from "./work-order-row-line";

export type WorkOrderRowsViewProps = {
  content: WorkOrderContent;
  changes: readonly WorkOrderChange[];
  /** The viewer's date and time format, from the server or a client card's hook. */
  dates: DateTimeFormat;
};

/**
 * A work order version's rows, with ★ on every row added or changed since the last sent version.
 * Removed rows come last, struck through. Shared by the ticket page and the assistant's card.
 */
export function WorkOrderRowsView({ content, changes, dates }: WorkOrderRowsViewProps) {
  const t = useTranslations("workOrder");
  const marked = new Map(changes.map((change) => [change.key, change]));
  const removed = changes.filter((change) => change.change === "REMOVED");
  if (content.rows.length <= 1 && removed.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("nothingIncluded")}</p>;
  }
  return (
    <ul data-slot="work-order-rows" className="divide-y">
      {content.rows.map((row) => (
        <WorkOrderRowLine
          dates={dates}
          key={row.key}
          row={row}
          parentKey={row.parentKey}
          change={marked.get(row.key)?.change}
        />
      ))}
      {removed.map((change) => (
        <WorkOrderRowLine
          dates={dates}
          key={change.key}
          row={{
            kind: change.kind,
            label: change.label,
            itemName: null,
            quantity: null,
            startsAt: null,
            endsAt: null,
            values: {},
          }}
          change="REMOVED"
        />
      ))}
    </ul>
  );
}
