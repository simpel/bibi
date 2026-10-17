import { Link } from "@okazi/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { ListDay, ListEntry } from "../calendar-list-model";

export type CalendarListProps = { days: ListDay[] };

function EntryText({ entry }: { entry: ListEntry }) {
  return (
    <>
      <span className="text-xs text-muted-foreground">
        {entry.time} · {entry.space}
      </span>
      <span className="font-medium">{entry.label}</span>
    </>
  );
}

/** Below `md` the grid gives way to a readable list: each day, then its blocks with the space. */
export async function CalendarList({ days }: CalendarListProps) {
  const t = await getTranslations("calendar");
  return (
    <div className="grid gap-4 md:hidden">
      {days.map((day) => (
        <section key={day.key} className="grid gap-2">
          <h3 className="text-sm font-medium">{day.label}</h3>
          {day.entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("emptyDay")}</p>
          ) : (
            <ul className="grid gap-2">
              {day.entries.map((entry) => (
                <li key={entry.id} className="grid rounded-md border p-2 text-sm">
                  {entry.href ? (
                    <Link href={entry.href} className="grid hover:underline">
                      <EntryText entry={entry} />
                    </Link>
                  ) : (
                    <EntryText entry={entry} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
