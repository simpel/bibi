"use client";

import {
  actionsColumn,
  type ColumnDef,
  cn,
  createTableColumns,
  Input,
  numberColumn,
  StatusBadge,
} from "@bibi/ui";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useInfiniteRows } from "@/components/data-table/use-infinite-rows";
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
  const [query, setQuery] = useState("");
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
          {
            ...actionsColumn<ReservationRow>({
              label: common("actions"),
              cell: (row) => (
                <ReservationRowActions row={row} canWrite={canWrite} onCancel={setCancelling} />
              ),
            }),
            size: 176,
          },
        ],
      }),
    [t, common, canWrite],
  );
  // Live: every keystroke filters the day's reservations, no submit and no round trip.
  const filtered = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return rows;
    return rows.filter((row) => {
      const text =
        `${row.time} ${row.name} ${row.tables} ${row.needs} ${row.stateLabel}`.toLowerCase();
      return words.every((word) => text.includes(word));
    });
  }, [rows, query]);
  const infinite = useInfiniteRows({ rows: filtered });
  return (
    <>
      <div className="relative pb-2 pl-4 pr-16 pt-[7px]">
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute left-7 top-[31px] size-5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={query}
          placeholder={common("search")}
          aria-label={common("search")}
          className="h-12 pl-10 text-base"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <PersistedDataTable
        tableId="reservation.day"
        columns={columns}
        data={[...infinite.rows]}
        flush
        getRowId={(row) => row.id}
        onRowClick={onSelect}
        rowClassName={(row) => cn("h-16 text-base", row.id === selectedId && "bg-accent")}
        rowMenu={(row) => (
          <ReservationRowMenu row={row} canWrite={canWrite} onCancel={setCancelling} />
        )}
        emptyText={t("empty")}
      />
      {infinite.more ? <div ref={infinite.end} className="h-px" /> : null}
      <CancelReservationDialog
        id={cancelling?.id ?? ""}
        name={cancelling?.name ?? ""}
        open={cancelling !== null}
        onOpenChange={(open) => (open ? null : setCancelling(null))}
      />
    </>
  );
}
