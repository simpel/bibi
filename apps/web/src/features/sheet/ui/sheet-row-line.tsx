import type { DateTimeFormat, SheetChange, SheetRow } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";

type RowFacts = Pick<
  SheetRow,
  "kind" | "label" | "itemName" | "quantity" | "startsAt" | "endsAt" | "values" | "addOnTo"
>;

export type SheetRowLineProps = {
  row: RowFacts;
  /** The marker when the row differs from the last sent version. */
  change?: SheetChange["change"];
  /** REQUIREMENT: the line it applies to; null = the whole ticket. ITEM: an add-on's parent row. */
  parentKey?: string | null;
  /** The viewer's date and time format: `getDateTimeFormat()` on the server, the hook in a client card. */
  dates: DateTimeFormat;
};

function Marker({ change }: { change: SheetChange["change"] | undefined }) {
  const t = useTranslations("sheet");
  const label = change ? t(`change.${change}`) : undefined;
  return (
    <span role="img" aria-label={label} title={label} className="w-4 text-center text-amber-600">
      {change ? "★" : null}
    </span>
  );
}

function Period({ row, dates: format }: { row: RowFacts; dates: DateTimeFormat }) {
  if (!row.startsAt || !row.endsAt) return null;
  return (
    <span className="text-muted-foreground">
      {format.dateTimeRange({ start: row.startsAt, end: row.endsAt })}
    </span>
  );
}

type TitleProps = { row: RowFacts; nested: boolean };

/** The row's name; an add-on whose parent is not on the sheet names it (ADR 0088). */
function Title({ row, nested }: TitleProps) {
  const t = useTranslations("sheet");
  // Versions before titles hold the bare reference.
  if (row.kind === "TICKET") {
    return <>{/^\d+$/.test(row.label) ? t("ticket", { reference: row.label }) : row.label}</>;
  }
  if (row.addOnTo !== undefined && !nested) {
    return <>{t("addOnTo", { name: row.label, parent: row.addOnTo })}</>;
  }
  const count = row.kind === "REQUIREMENT" && row.quantity !== null ? ` × ${row.quantity}` : "";
  return <>{`${row.label}${count}`}</>;
}

/** One sheet row with its ★ marker: the ticket, an item with its fields, or a count. */
export function SheetRowLine({ row, change, parentKey, dates }: SheetRowLineProps) {
  const t = useTranslations("sheet");
  const details = Object.values(row.values).filter((value) => value !== null && value !== "");
  const muted = "text-muted-foreground";
  const nested = row.kind === "ITEM" && Boolean(parentKey);
  return (
    <li
      data-slot="sheet-row"
      data-change={change}
      className={`flex flex-wrap items-baseline gap-x-2 py-2 text-sm${nested ? " pl-6" : ""}`}
    >
      <Marker change={change} />
      <span className={change === "REMOVED" ? "font-medium line-through" : "font-medium"}>
        <Title row={row} nested={nested} />
      </span>
      {nested && row.addOnTo !== undefined ? <span className={muted}>{t("addOn")}</span> : null}
      {row.itemName ? <span className={muted}>{row.itemName}</span> : null}
      {row.kind === "ITEM" && row.quantity !== null ? <span>× {row.quantity}</span> : null}
      {row.kind === "TICKET" && row.quantity !== null ? (
        <span>{t("headcount", { count: row.quantity })}</span>
      ) : null}
      {row.kind === "REQUIREMENT" ? (
        <span className={muted}>{parentKey ? t("onLine") : t("onTicket")}</span>
      ) : null}
      <Period row={row} dates={dates} />
      {details.length > 0 ? <span className={muted}>{details.map(String).join(", ")}</span> : null}
    </li>
  );
}
