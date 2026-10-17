import type { SeriesOccurrenceDto } from "@okazi/core";
import type { BookingStatusDto } from "@okazi/core/schemas";
import { Link } from "@okazi/i18n/navigation";
import { actionsColumn, Badge, type ColumnDef } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { bookingRoute } from "@/lib/routes";
import { BookingStatusLabel } from "../../booking/ui/booking-status-label";
import { isOccurrenceEditable } from "./is-occurrence-editable";
import { OccurrenceRowActions } from "./occurrence-row-actions";

type Column = ColumnDef<SeriesOccurrenceDto>;
type Translate = ReturnType<typeof useTranslations<"bookingSeries">>;
type BookingTranslate = ReturnType<typeof useTranslations<"booking">>;

const PERIOD = { dateStyle: "medium", timeStyle: "short" } as const;

export type OccurrenceColumnsInput = {
  seriesId: string;
  cancelled: boolean;
  total: number;
  statuses: BookingStatusDto[];
  rooms: NamedOption[];
};

type LinkInput = { t: Translate; booking: BookingTranslate; total: number };

const bookingColumns = ({ t, booking, total }: LinkInput): Column[] => [
  {
    id: "booking",
    header: t("columns.booking"),
    accessorFn: (o) => o.reference,
    cell: ({ row: { original: o } }) => (
      <Link href={bookingRoute({ id: o.bookingId })} className="font-medium hover:underline">
        {booking("reference", { reference: o.reference })}
      </Link>
    ),
  },
  {
    id: "occurrence",
    header: t("columns.occurrence"),
    accessorFn: (o) => o.occurrenceIndex,
    cell: ({ row }) => t("occurrence", { index: row.original.occurrenceIndex, total }),
  },
];

type StateInput = {
  t: Translate;
  statuses: BookingStatusDto[];
  format: ReturnType<typeof useFormatter>;
};

const stateColumns = ({ t, statuses, format }: StateInput): Column[] => [
  {
    id: "status",
    header: t("columns.status"),
    accessorFn: (o) => statuses.find(({ id }) => id === o.bookingStatusId)?.name ?? "",
    cell: ({ row }) => <BookingStatusLabel statuses={statuses} id={row.original.bookingStatusId} />,
  },
  {
    id: "clash",
    header: t("columns.clash"),
    accessorFn: (o) => o.clash,
    cell: ({ row }) => (row.original.clash ? <Badge variant="warning">{t("clash")}</Badge> : "–"),
  },
  {
    id: "when",
    header: t("columns.when"),
    accessorFn: (o) => o.startsAt,
    cell: ({ row: { original: o } }) => format.dateTimeRange(o.startsAt, o.endsAt, PERIOD),
  },
];

/** Booking (link), position, status, clash marker and time, with a change action per row. */
export function useOccurrenceColumns({
  seriesId,
  cancelled,
  total,
  statuses,
  rooms,
}: OccurrenceColumnsInput): Column[] {
  const t = useTranslations("bookingSeries");
  const booking = useTranslations("booking");
  const common = useTranslations("common");
  const format = useFormatter();
  return useMemo<Column[]>(
    () => [
      ...bookingColumns({ t, booking, total }),
      ...stateColumns({ t, statuses, format }),
      actionsColumn<SeriesOccurrenceDto>({
        label: common("actions"),
        cell: (occurrence) =>
          isOccurrenceEditable({ cancelled, statuses, occurrence }) ? (
            <OccurrenceRowActions
              seriesId={seriesId}
              occurrence={occurrence}
              total={total}
              rooms={rooms}
            />
          ) : null,
      }),
    ],
    [t, booking, common, format, seriesId, cancelled, total, statuses, rooms],
  );
}
