"use client";

import { Link } from "@bibi/i18n/navigation";
import { Card, type ColumnDef } from "@bibi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { ticketRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type SheetTableViewProps = GenerativeProps<"sheet-table">;

type Row = SheetTableViewProps["items"][number];

function useSheetColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.sheet");
  const format = useFormatter();
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "version",
        header: t("columns.version"),
        accessorFn: (sheet) => sheet.version,
        cell: ({ row }) => (
          <Link
            href={ticketRoute({ id: row.original.ticketId })}
            className="font-medium hover:underline"
          >
            {t("version", { version: row.original.version })}
          </Link>
        ),
      },
      {
        id: "changes",
        header: t("columns.changes"),
        accessorFn: (sheet) => sheet.changes.length,
        cell: ({ row }) =>
          row.original.changes.length > 0 ? `★ ${row.original.changes.length}` : "–",
      },
      {
        id: "sent",
        header: t("columns.sent"),
        accessorFn: (sheet) => (sheet.sentAt ? new Date(sheet.sentAt) : undefined),
        cell: ({ row }) =>
          row.original.sentAt
            ? format.dateTime(new Date(row.original.sentAt), { dateStyle: "medium" })
            : t("notSent"),
      },
    ],
    [t, format],
  );
}

/** A page of sheet versions; each row links to its ticket's page. */
export function SheetTableView({ items, nextCursor }: SheetTableViewProps) {
  const t = useTranslations("assistant.ui.sheet");
  const columns = useSheetColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="sheet-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.sheet"
        columns={columns}
        data={items}
        getRowId={(sheet) => sheet.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
