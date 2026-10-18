"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, type ColumnDef } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { ticketRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { occupancyPeriod } from "./occupancy-period";

export type ProgramItemTableViewProps = GenerativeProps<"program-item-table">;

type Row = ProgramItemTableViewProps["items"][number];

function useProgramItemColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.programItem");
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
        accessorFn: (item) => new Date(item.startsAt),
        cell: ({ row }) => occupancyPeriod({ format, ...row.original }),
      },
      {
        id: "quantity",
        header: t("columns.quantity"),
        accessorFn: (item) => item.quantity ?? undefined,
        cell: ({ row }) => row.original.quantity ?? "–",
      },
    ],
    [t, format],
  );
}

/** A page of program items; each name links to its ticket's page. */
export function ProgramItemTableView({ items, nextCursor }: ProgramItemTableViewProps) {
  const t = useTranslations("assistant.ui.programItem");
  const columns = useProgramItemColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="program-item-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.program-item"
        columns={columns}
        data={items}
        getRowId={(item) => item.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
