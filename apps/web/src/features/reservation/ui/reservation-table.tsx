"use client";

import {
  actionsColumn,
  type ColumnDef,
  createTableColumns,
  numberColumn,
  StatusBadge,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ClientDataTable } from "@/components/data-table/client-data-table";
import { Link } from "@/lib/navigation";
import type { ReservationRow } from "../lib/reservation-row";
import { reservationRoute } from "../lib/routes";
import { CancelReservationDialog } from "./cancel-reservation-dialog";
import { ReservationRowActions, ReservationRowMenu } from "./reservation-row-actions";

export type ReservationTableProps = {
  rows: readonly ReservationRow[];
  canWrite: boolean;
  /** The reservation selected here and on the floor. */
  selectedId: string | null;
  onSelect: (row: ReservationRow) => void;
};

/** The day's reservations; a row selects it (its tables light on the floor), its time opens it. */
export function ReservationTable({ rows, canWrite, selectedId, onSelect }: ReservationTableProps) {
  const t = useTranslations("reservation");
  const common = useTranslations("common");
  const [cancelling, setCancelling] = useState<ReservationRow | null>(null);
  const columns = useMemo<ColumnDef<ReservationRow>[]>(
    () =>
      createTableColumns<ReservationRow>({
        primary: [
          {
            id: "time",
            header: t("columns.time"),
            accessorFn: (row) => row.startsAtMs,
            cell: ({ row }) => (
              <Link
                href={reservationRoute({ id: row.original.id })}
                className="font-medium tabular-nums hover:underline"
              >
                {row.original.time}
              </Link>
            ),
          },
        ],
        relations: [
          { id: "name", header: t("columns.name"), accessorFn: (row) => row.name },
          { id: "tables", header: t("columns.tables"), accessorFn: (row) => row.tables },
          { id: "needs", header: t("columns.needs"), accessorFn: (row) => row.needs },
        ],
        status: [
          {
            id: "state",
            header: t("columns.state"),
            accessorFn: (row) => row.stateLabel,
            cell: ({ row }) => <StatusBadge label={row.original.stateLabel} />,
          },
        ],
        numbers: [
          numberColumn<ReservationRow>({
            id: "party",
            header: t("columns.party"),
            getValue: (row) => row.partySize,
            cell: (row) => String(row.partySize),
          }),
        ],
        actions: [
          actionsColumn<ReservationRow>({
            label: common("actions"),
            cell: (row) => (
              <ReservationRowActions row={row} canWrite={canWrite} onCancel={setCancelling} />
            ),
          }),
        ],
      }),
    [t, common, canWrite],
  );
  return (
    <>
      <ClientDataTable
        tableId="reservation.day"
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        getSearchText={(row) => `${row.name} ${row.tables} ${row.needs}`}
        onRowClick={onSelect}
        rowClassName={(row) => (row.id === selectedId ? "bg-accent" : undefined)}
        rowMenu={(row) => (
          <ReservationRowMenu row={row} canWrite={canWrite} onCancel={setCancelling} />
        )}
        emptyText={t("empty")}
      />
      <CancelReservationDialog
        id={cancelling?.id ?? ""}
        name={cancelling?.name ?? ""}
        open={cancelling !== null}
        onOpenChange={(open) => (open ? null : setCancelling(null))}
      />
    </>
  );
}
