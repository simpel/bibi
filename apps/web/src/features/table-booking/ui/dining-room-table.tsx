"use client";

import { type ColumnDef, createTableColumns, dateColumn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ClientDataTable } from "@/components/data-table/client-data-table";
import { Link, useRouter } from "@/lib/navigation";
import type { DiningRoomRow } from "../lib/room-row";
import { tableBookingRoomRoute } from "../lib/routes";

export type DiningRoomTableProps = { rows: readonly DiningRoomRow[] };

/** The rooms set up for table booking; a row opens the room's booking settings. */
export function DiningRoomTable({ rows }: DiningRoomTableProps) {
  const t = useTranslations("tableBooking.rooms");
  const router = useRouter();
  const columns = useMemo<ColumnDef<DiningRoomRow>[]>(
    () =>
      createTableColumns<DiningRoomRow>({
        primary: [
          {
            id: "name",
            header: t("columns.name"),
            accessorFn: (row) => row.name,
            cell: ({ row }) => (
              <Link
                href={tableBookingRoomRoute({ itemId: row.original.itemId })}
                className="font-medium hover:underline"
              >
                {row.original.name}
              </Link>
            ),
          },
        ],
        relations: [
          {
            id: "slug",
            header: t("columns.slug"),
            accessorFn: (row) => row.slug,
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.slug}</span>,
          },
        ],
        dates: [
          dateColumn<DiningRoomRow>({
            id: "openUntil",
            header: t("columns.openUntil"),
            getSortValue: (row) => row.openUntilSort,
            cell: (row) => row.openUntil || t("noLimit"),
          }),
        ],
      }),
    [t],
  );
  return (
    <ClientDataTable
      tableId="table-booking.rooms"
      columns={columns}
      data={rows}
      getRowId={(row) => row.itemId}
      getSearchText={(row) => `${row.name} ${row.slug}`}
      onRowClick={(row) => router.push(tableBookingRoomRoute({ itemId: row.itemId }))}
      emptyText={t("empty")}
    />
  );
}
