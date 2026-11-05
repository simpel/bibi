"use client";

import { Card, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { Link } from "@/lib/navigation";
import { orderRoute } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type RunSheetTableViewProps = GenerativeProps<"run-sheet-table">;

type Row = RunSheetTableViewProps["items"][number];

function useRunSheetColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.runSheet");
  const format = useDateTimeFormat();
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "version",
        header: t("columns.version"),
        accessorFn: (runSheet) => runSheet.version,
        cell: ({ row }) => (
          <Link
            href={orderRoute({ id: row.original.orderId })}
            className="font-medium hover:underline"
          >
            {t("version", { version: row.original.version })}
          </Link>
        ),
      },
      {
        id: "changes",
        header: t("columns.changes"),
        accessorFn: (runSheet) => runSheet.changes.length,
        cell: ({ row }) =>
          row.original.changes.length > 0 ? `★ ${row.original.changes.length}` : "–",
      },
      {
        id: "published",
        header: t("columns.sent"),
        accessorFn: (runSheet) => {
          const raw = runSheet.publishedAt ?? (runSheet as unknown as { sentAt?: string }).sentAt;
          return raw ? new Date(raw) : undefined;
        },
        cell: ({ row }) => {
          const raw =
            row.original.publishedAt ?? (row.original as unknown as { sentAt?: string }).sentAt;
          return raw ? format.date({ instant: raw }) : t("notSent");
        },
      },
    ],
    [t, format],
  );
}

/** A page of run sheet versions; each row links to its order's page. */
export function RunSheetTableView({ items, nextCursor }: RunSheetTableViewProps) {
  const t = useTranslations("assistant.ui.runSheet");
  const columns = useRunSheetColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="run-sheet-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.runSheet"
        columns={columns}
        data={items}
        getRowId={(runSheet) => runSheet.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
