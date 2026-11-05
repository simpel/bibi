import type { DateTimeFormat, RunSheetChange, RunSheetContent } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { RunSheetRowLine } from "./run-sheet-row-line";

export type RunSheetRowsViewProps = {
  content: RunSheetContent;
  changes: readonly RunSheetChange[];
  /** The viewer's date and time format, from the server or a client card's hook. */
  dates: DateTimeFormat;
};

/**
 * A run sheet version's rows, with ★ on every row added or changed since the last sent version.
 * Removed rows come last, struck through. Shared by the order page and the assistant's card.
 */
export function RunSheetRowsView({ content, changes, dates }: RunSheetRowsViewProps) {
  const t = useTranslations("runSheet");
  const marked = new Map(changes.map((change) => [change.key, change]));
  const removed = changes.filter((change) => change.change === "REMOVED");
  if (content.rows.length <= 1 && removed.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("nothingIncluded")}</p>;
  }
  return (
    <ul data-slot="run-sheet-rows" className="divide-y">
      {content.rows.map((row) => (
        <RunSheetRowLine
          dates={dates}
          key={row.key}
          row={row}
          parentKey={row.parentKey}
          change={marked.get(row.key)?.change}
        />
      ))}
      {removed.map((change) => (
        <RunSheetRowLine
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
