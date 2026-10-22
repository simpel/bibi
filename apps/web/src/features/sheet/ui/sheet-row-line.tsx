import type { SheetChange, SheetRow } from "@bibi/core/schemas";
import { useFormatter, useTranslations } from "next-intl";

type RowFacts = Pick<
  SheetRow,
  "kind" | "label" | "itemName" | "quantity" | "startsAt" | "endsAt" | "values"
>;

export type SheetRowLineProps = {
  row: RowFacts;
  /** The marker when the row differs from the last sent version. */
  change?: SheetChange["change"];
  /** REQUIREMENT: the line it applies to; null = the whole ticket. */
  parentKey?: string | null;
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

function Period({ row }: { row: RowFacts }) {
  const format = useFormatter();
  if (!row.startsAt || !row.endsAt) return null;
  const options = { dateStyle: "short", timeStyle: "short" } as const;
  return (
    <span className="text-muted-foreground">
      {format.dateTime(new Date(row.startsAt), options)} –{" "}
      {format.dateTime(new Date(row.endsAt), options)}
    </span>
  );
}

function Title({ row }: { row: RowFacts }) {
  const t = useTranslations("sheet");
  if (row.kind === "TICKET") return <>{t("ticket", { reference: row.label })}</>;
  const count = row.kind === "REQUIREMENT" && row.quantity !== null ? ` × ${row.quantity}` : "";
  return <>{`${row.label}${count}`}</>;
}

/** One sheet row with its ★ marker: the ticket, an item with its fields, or a count. */
export function SheetRowLine({ row, change, parentKey }: SheetRowLineProps) {
  const t = useTranslations("sheet");
  const details = Object.values(row.values).filter((value) => value !== null && value !== "");
  const muted = "text-muted-foreground";
  return (
    <li
      data-slot="sheet-row"
      data-change={change}
      className="flex flex-wrap items-baseline gap-x-2 py-2 text-sm"
    >
      <Marker change={change} />
      <span className={change === "REMOVED" ? "font-medium line-through" : "font-medium"}>
        <Title row={row} />
      </span>
      {row.itemName ? <span className={muted}>{row.itemName}</span> : null}
      {row.kind === "ITEM" && row.quantity !== null ? <span>× {row.quantity}</span> : null}
      {row.kind === "TICKET" && row.quantity !== null ? (
        <span>{t("headcount", { count: row.quantity })}</span>
      ) : null}
      {row.kind === "REQUIREMENT" ? (
        <span className={muted}>{parentKey ? t("onLine") : t("onTicket")}</span>
      ) : null}
      <Period row={row} />
      {details.length > 0 ? <span className={muted}>{details.map(String).join(", ")}</span> : null}
    </li>
  );
}
