import type { SystemLogEntry } from "@bibi/core/schemas";
import type { ColumnDef } from "@bibi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { LevelBadge } from "./level-badge";

type Column = ColumnDef<SystemLogEntry>;

function Muted({ value }: { value: string | number | null }) {
  return value === null ? <span className="text-muted-foreground">–</span> : <span>{value}</span>;
}

const text = ({
  id,
  header,
  pick,
}: {
  id: string;
  header: string;
  pick: (e: SystemLogEntry) => string | number | null;
}): Column => ({
  id,
  header,
  cell: ({ row }) => <Muted value={pick(row.original)} />,
});

/** Columns of the system log table; the full entry is in the row's detail sheet. */
export function useLogColumns(): Column[] {
  const t = useTranslations("admin.logs.columns");
  const format = useFormatter();
  return useMemo<Column[]>(() => {
    const time: Column = {
      id: "time",
      header: t("time"),
      cell: ({ row }) => (
        <time className="whitespace-nowrap tabular-nums" dateTime={row.original.time.toISOString()}>
          {format.dateTime(row.original.time, { dateStyle: "short", timeStyle: "medium" })}
        </time>
      ),
    };
    return [
      time,
      {
        id: "level",
        header: t("level"),
        cell: ({ row }) => <LevelBadge level={row.original.level} />,
      },
      {
        id: "event",
        header: t("event"),
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.event}</span>,
      },
      text({ id: "operation", header: t("operation"), pick: (e) => e.operation }),
      text({ id: "surface", header: t("surface"), pick: (e) => e.surface }),
      text({ id: "status", header: t("status"), pick: (e) => e.status }),
      text({ id: "duration", header: t("duration"), pick: (e) => e.durationMs }),
    ];
  }, [t, format]);
}
