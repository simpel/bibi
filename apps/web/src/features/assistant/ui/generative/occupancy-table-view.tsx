"use client";

import { Card, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { itemRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { occupancyPeriod } from "./occupancy-period";

export type OccupancyTableViewProps = GenerativeProps<"occupancy-table">;

type Row = OccupancyTableViewProps["items"][number];

function useOccupancyColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.occupancy");
  const types = useTranslations("occupancy.types");
  const format = useDateTimeFormat();
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "type",
        header: t("columns.type"),
        accessorFn: (occupancy) => types(occupancy.type),
        cell: ({ row }) => (
          <Link
            href={itemRoute({ id: row.original.itemId })}
            className="font-medium hover:underline"
          >
            {types(row.original.type)}
          </Link>
        ),
      },
      {
        id: "note",
        header: t("columns.note"),
        accessorFn: (occupancy) => occupancy.note ?? undefined,
        cell: ({ row }) => row.original.note ?? "–",
      },
      {
        id: "period",
        header: t("columns.period"),
        accessorFn: (occupancy) => new Date(occupancy.startsAt),
        cell: ({ row }) => occupancyPeriod({ format, ...row.original }),
      },
    ],
    [t, types, format],
  );
}

/** A page of occupancies; each type links to the item's page. */
export function OccupancyTableView({ items, nextCursor }: OccupancyTableViewProps) {
  const t = useTranslations("assistant.ui.occupancy");
  const columns = useOccupancyColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="occupancy-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.occupancy"
        columns={columns}
        data={items}
        getRowId={(occupancy) => occupancy.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
