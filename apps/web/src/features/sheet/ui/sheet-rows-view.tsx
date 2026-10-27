import type { DateTimeFormat, SheetChange, SheetContent } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { SheetRowLine } from "./sheet-row-line";

export type SheetRowsViewProps = {
  content: SheetContent;
  changes: readonly SheetChange[];
  /** The viewer's date and time format, from the server or a client card's hook. */
  dates: DateTimeFormat;
};

/**
 * A sheet version's rows, with ★ on every row added or changed since the last sent version.
 * Removed rows come last, struck through. Shared by the ticket page and the assistant's card.
 */
export function SheetRowsView({ content, changes, dates }: SheetRowsViewProps) {
  const t = useTranslations("sheet");
  const marked = new Map(changes.map((change) => [change.key, change]));
  const removed = changes.filter((change) => change.change === "REMOVED");
  if (content.rows.length <= 1 && removed.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("nothingIncluded")}</p>;
  }
  return (
    <ul data-slot="sheet-rows" className="divide-y">
      {content.rows.map((row) => (
        <SheetRowLine
          dates={dates}
          key={row.key}
          row={row}
          parentKey={row.parentKey}
          change={marked.get(row.key)?.change}
        />
      ))}
      {removed.map((change) => (
        <SheetRowLine
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
