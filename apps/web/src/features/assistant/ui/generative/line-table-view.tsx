"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, type ColumnDef } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { ticketRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { linePeriod } from "./occupancy-period";

export type LineTableViewProps = GenerativeProps<"line-table">;

type Row = LineTableViewProps["items"][number];

function useLineColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.line");
  const format = useFormatter();
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (item) => item.name,
        cell: ({ row }) => (
          <Link
            href={ticketRoute({ id: row.original.ticketId })}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        id: "when",
        header: t("columns.when"),
        accessorFn: (item) => (item.startsAt ? new Date(item.startsAt) : undefined),
        cell: ({ row }) => linePeriod({ format, ...row.original }) ?? t("untimed"),
      },
      {
        id: "quantity",
        header: t("columns.quantity"),
        accessorFn: (item) => item.effectiveQuantity ?? undefined,
        cell: ({ row }) => row.original.effectiveQuantity ?? "–",
      },
    ],
    [t, format],
  );
}

/** A page of lines; each name links to its ticket's page. */
export function LineTableView({ items, nextCursor }: LineTableViewProps) {
  const t = useTranslations("assistant.ui.line");
  const columns = useLineColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="line-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.line"
        columns={columns}
        data={items}
        getRowId={(item) => item.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
