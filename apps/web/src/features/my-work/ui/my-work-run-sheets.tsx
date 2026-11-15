import type { DateTimeFormat } from "@bibi/core/schemas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { dayGroups } from "../lib/day-groups";
import { MyWorkPager } from "./my-work-pager";
import { MyWorkRow } from "./my-work-row";
import type { MyWorkWireish } from "./my-work-wireish";

export type MyWorkRunSheetsProps = {
  work: Pick<MyWorkWireish, "rows" | "timeZone" | "page" | "limit" | "rowsTotal">;
  dates: DateTimeFormat;
  /** The link to another page of rows; without it (the assistant's card) no page controls show. */
  pageHref?: (input: { page: number }) => string;
};

/** The main section: every run sheet row that concerns the caller, a heading per day (ADR 0110). */
export function MyWorkRunSheets({ work, dates, pageHref }: MyWorkRunSheetsProps) {
  const t = useTranslations("myWork.rows");
  const { rows, timeZone } = work;
  if (rows === null) return null;
  const days = dayGroups({
    rows,
    dayOf: (row) => dates.date({ instant: new Date(row.at), timeZone, weekday: "long" }),
  });
  return (
    <Card data-slot="my-work-run-sheets" className="border-2 border-foreground/80 shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 p-4 pt-0">
        {days.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : null}
        {days.map((day) => (
          <section key={day.key} className="grid gap-1">
            <h3 className="text-sm font-semibold">
              {day.key}{" "}
              <span className="font-normal text-muted-foreground">
                {t("dayCount", { count: day.rows.length })}
              </span>
            </h3>
            <ul className="grid">
              {day.rows.map((row) => (
                <MyWorkRow
                  key={`${row.runSheetId}:${row.key}`}
                  row={row}
                  timeZone={timeZone}
                  dates={dates}
                />
              ))}
            </ul>
          </section>
        ))}
        <MyWorkPager work={work} pageHref={pageHref} />
        <Link href={ROUTES.runSheets} className="text-sm font-medium hover:underline">
          {t("all")}
        </Link>
      </CardContent>
    </Card>
  );
}
