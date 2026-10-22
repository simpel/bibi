import { useTranslations } from "next-intl";
import { groupRows, type HoursRow } from "../../lib/hours";

type Day = "0" | "1" | "2" | "3" | "4" | "5" | "6";

/** One line per run of equal days: "Monday–Friday 08:00–17:00, lunch 12:00–13:00". */
export function HoursSummary({ rows }: { rows: readonly HoursRow[] }) {
  const t = useTranslations("welcome.hours");
  const day = ({ weekday }: { weekday: number }) => t(`day.${String(weekday) as Day}`);
  return (
    <ul className="grid gap-2 rounded-lg border p-4">
      {groupRows({ rows }).map(({ from, to, row }) => (
        <li key={from} className="flex flex-wrap justify-between gap-x-6 gap-y-1">
          <span className="font-medium">
            {from === to
              ? day({ weekday: from })
              : `${day({ weekday: from })}–${day({ weekday: to })}`}
          </span>
          <span className="text-muted-foreground">
            {row.works ? `${row.start}–${row.end}` : t("off")}
            {row.works && row.breakStart && row.breakEnd
              ? ` · ${t("lunch", { start: row.breakStart, end: row.breakEnd })}`
              : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
