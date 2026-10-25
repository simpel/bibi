import { useTranslations } from "next-intl";
import type { ExceptionRow } from "../lib/hours-exceptions";

/** One line per dated exception: "2026-12-24 · Closed · Christmas Eve". */
export function HoursExceptionsSummary({ rows }: { rows: readonly ExceptionRow[] }) {
  const t = useTranslations("hours");
  if (rows.length === 0) return null;
  return (
    <ul className="grid gap-2 rounded-lg border p-4">
      {rows.map((row) => (
        <li key={row.date} className="flex flex-wrap justify-between gap-x-6 gap-y-1">
          <span className="font-medium">{row.date}</span>
          <span className="text-muted-foreground">
            {row.closed ? t("closed") : `${row.start}–${row.end}`}
            {row.note ? ` · ${row.note}` : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
