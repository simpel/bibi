import type { DateTimeFormat, RunSheetDto } from "@bibi/core/schemas";
import { Badge } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type RunSheetHistoryProps = {
  versions: RunSheetDto[];
  dates: DateTimeFormat;
};

type HistoryEvent = {
  id: string;
  kind: "CREATED" | "REVISED" | "PUBLISHED" | "FULFILLED";
  version: number;
  at: Date;
  changesCount?: number;
  baseVersion?: number | null;
};

/** Reconstructs the state transition history across all versions, newest first. */
function buildHistoryEvents({ versions }: { versions: RunSheetDto[] }): HistoryEvent[] {
  const events: HistoryEvent[] = [];

  for (const v of versions) {
    // Fulfilled event
    if (v.fulfilledAt) {
      events.push({
        id: `${v.id}-fulfilled`,
        kind: "FULFILLED",
        version: v.version,
        at: new Date(v.fulfilledAt),
      });
    }

    // Published event
    if (v.publishedAt) {
      events.push({
        id: `${v.id}-published`,
        kind: "PUBLISHED",
        version: v.version,
        at: new Date(v.publishedAt),
      });
    }

    // Generation event
    if (v.version > 1) {
      events.push({
        id: `${v.id}-revised`,
        kind: "REVISED",
        version: v.version,
        at: new Date(v.createdAt),
        changesCount: v.changes.length,
        baseVersion: v.baseVersion,
      });
    } else {
      events.push({
        id: `${v.id}-created`,
        kind: "CREATED",
        version: 1,
        at: new Date(v.createdAt),
      });
    }
  }

  return events.sort((a, b) => b.at.getTime() - a.at.getTime());
}

/** State change history on the run sheet detail page. */
export function RunSheetHistory({ versions, dates: format }: RunSheetHistoryProps) {
  const t = useTranslations("runSheet");
  const events = buildHistoryEvents({ versions });

  if (events.length === 0) return null;

  return (
    <section data-slot="run-sheet-history" className="grid gap-3 border-t pt-6">
      <h3 className="font-serif text-lg font-medium">{t("history.title")}</h3>
      <ol className="divide-y rounded-md border">
        {events.map((event) => (
          <li
            key={event.id}
            className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="tabular-nums">
                v{event.version}
              </Badge>
              <span className="font-medium">
                {t(
                  `history.events.${event.kind.toLowerCase() as "created" | "revised" | "published" | "fulfilled"}`,
                )}
              </span>
              {event.kind === "REVISED" && event.changesCount != null ? (
                <span className="text-muted-foreground text-xs">
                  {t("history.changesSummary", { count: event.changesCount })}
                </span>
              ) : null}
            </div>
            <time className="text-muted-foreground text-xs" dateTime={event.at.toISOString()}>
              {format.dateTime({ instant: event.at })}
            </time>
          </li>
        ))}
      </ol>
    </section>
  );
}
