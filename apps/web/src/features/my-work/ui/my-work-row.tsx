import type { DateTimeFormat } from "@bibi/core/schemas";
import { Badge } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { RUN_SHEET_BADGE_VARIANTS } from "@/features/run-sheet/ui/run-sheet-status";
import { Link } from "@/lib/navigation";
import { orderRoute } from "@/lib/routes";
import type { MyWorkRowWireish } from "./my-work-wireish";

export type MyWorkRowProps = { row: MyWorkRowWireish; timeZone: string; dates: DateTimeFormat };

/** "Gluten 2 · Lactose 1 (whole order)": the line's counts, a blocking one marked. */
function useNeedsText({ row }: { row: MyWorkRowWireish }) {
  const t = useTranslations("myWork.rows");
  return row.needs.map((need) => ({
    key: `${need.scope}:${need.name}`,
    blocking: need.blocking,
    text: [
      need.name,
      need.quantity ?? "",
      need.scope === "ORDER" ? `(${t("wholeOrder")})` : "",
      need.blocking ? `· ${t("contains")}` : "",
    ]
      .filter(Boolean)
      .join(" "),
  }));
}

/** One thing to prepare, run or set up: when, how many of what, for which order, and its state. */
export function MyWorkRow({ row, timeZone, dates }: MyWorkRowProps) {
  const t = useTranslations("myWork");
  const status = useTranslations("runSheet.status");
  const needs = useNeedsText({ row });
  const at = new Date(row.at);
  const time = row.timed ? dates.time({ instant: at, timeZone }) : t("rows.untimed");
  const changed = row.added || row.changed.length > 0;
  return (
    <li
      data-slot="my-work-row"
      data-changed={changed || undefined}
      data-blocked={row.status === "BLOCKED" || undefined}
      className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] gap-3 border-t py-2.5 first:border-t-0 data-[blocked]:bg-destructive/5 data-[changed]:bg-warning/10"
    >
      <span className="pl-1 text-sm font-medium tabular-nums">{time}</span>
      <div className="grid min-w-0 gap-0.5">
        <p className="text-sm">
          {row.quantity !== null ? (
            <strong className="font-semibold">{row.quantity} × </strong>
          ) : null}
          {row.label}
          {changed ? (
            <span className="ml-2 text-xs font-medium text-warning-foreground">
              {row.added ? t("rows.added") : t("rows.changed")}
            </span>
          ) : null}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          <Link href={orderRoute({ id: row.orderId })} className="hover:underline">
            #{row.reference} {row.title ?? ""}
          </Link>
          {row.customerName ? ` · ${row.customerName}` : null}
        </p>
        {needs.length > 0 ? (
          <p className="text-xs">
            {needs.map((need, index) => (
              <span
                key={need.key}
                className={need.blocking ? "font-medium text-destructive" : undefined}
              >
                {index > 0 ? " · " : null}
                {need.text}
              </span>
            ))}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col items-end gap-1 pr-1">
        <Link href={`/run-sheets/${encodeURIComponent(row.runSheetId)}`}>
          <Badge variant="outline">{row.runSheetName}</Badge>
        </Link>
        <Badge variant={RUN_SHEET_BADGE_VARIANTS[row.status]}>
          {status(row.status.toLowerCase() as Parameters<typeof status>[0])}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {t(`reasons.${row.reasons[0] ?? "ASSIGNEE"}`)}
        </span>
      </div>
    </li>
  );
}
