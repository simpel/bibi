import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import type { ListDay, ListEntry } from "../calendar-list-model";

/** A colored left border for a block's state, dashed for a soft hold. */
export const markerStyle = ({ entry }: { entry: ListEntry }) =>
  entry.color
    ? {
        borderLeftColor: entry.color,
        borderLeftWidth: 4,
        borderLeftStyle: entry.soft ? ("dashed" as const) : ("solid" as const),
      }
    : undefined;

export type CalendarListProps = {
  days: ListDay[];
  /** The list view itself; otherwise it is the fallback below `md` for the grid and month. */
  always?: boolean;
};

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

/** Each day, then its blocks with the space: the list view, and the grid's fallback below `md`. */
export async function CalendarList({ days, always = false }: CalendarListProps) {
  const t = await getTranslations("calendar");
  return (
    <div className={always ? "grid gap-4" : "grid gap-4 md:hidden"}>
      {days.map((day) => (
        <section key={day.key} className="grid gap-2">
          <h3 className="text-sm font-medium">{day.label}</h3>
          {day.entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("emptyDay")}</p>
          ) : (
            <ul className="grid gap-2">
              {day.entries.map((entry) => (
                <li
                  key={entry.id}
                  className="grid rounded-md border p-2 text-sm"
                  style={markerStyle({ entry })}
                >
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
