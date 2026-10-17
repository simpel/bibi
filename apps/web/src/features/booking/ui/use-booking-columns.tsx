import type { BookingDto } from "@okazi/core";
import type { BookingStatusDto } from "@okazi/core/schemas";
import type { ColumnDef } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { namedOptionColumn } from "@/components/data-table/named-option-column";
import type { NamedOption } from "@/components/form/named-option";
import { BookingReferenceCell } from "./booking-reference-cell";
import { BookingStatusLabel } from "./booking-status-label";

const PERIOD = { dateStyle: "medium", timeStyle: "short" } as const;

type Column = ColumnDef<BookingDto>;
type Translate = ReturnType<typeof useTranslations<"booking">>;
type Format = ReturnType<typeof useFormatter>;

export type BookingLookups = {
  customers: NamedOption[];
  members: NamedOption[];
  types: NamedOption[];
  statuses: BookingStatusDto[];
  seriesTotals: Record<string, number>;
};

type ReferenceInput = { t: Translate; seriesTotals: Record<string, number> };

const referenceColumn = ({ t, seriesTotals }: ReferenceInput): Column => ({
  id: "reference",
  header: t("columns.reference"),
  accessorFn: (booking) => booking.reference,
  cell: ({ row: { original: booking } }) => (
    <BookingReferenceCell
      booking={booking}
      reference={t("reference", { reference: booking.reference })}
      total={booking.seriesId ? seriesTotals[booking.seriesId] : undefined}
    />
  ),
});

const statusColumn = ({ t, statuses }: { t: Translate; statuses: BookingStatusDto[] }): Column => ({
  id: "status",
  header: t("columns.status"),
  accessorFn: (b) => statuses.find(({ id }) => id === b.bookingStatusId)?.name ?? "",
  cell: ({ row }) => <BookingStatusLabel statuses={statuses} id={row.original.bookingStatusId} />,
});

const whenColumn = ({ t, format }: { t: Translate; format: Format }): Column => ({
  id: "when",
  header: t("columns.when"),
  accessorFn: (booking) => booking.startsAt,
  cell: ({ row: { original: b } }) => format.dateTimeRange(b.startsAt, b.endsAt, PERIOD),
});

type NamedInput = Pick<BookingLookups, "customers" | "members" | "types"> & { t: Translate };

const namedColumns = ({ t, customers, members, types }: NamedInput): Column[] => [
  namedOptionColumn({
    id: "customer",
    header: t("columns.customer"),
    options: customers,
    pick: (booking: BookingDto) => booking.customerId,
  }),
  namedOptionColumn({
    id: "type",
    header: t("columns.type"),
    options: types,
    pick: (booking: BookingDto) => booking.entityTypeId,
  }),
  namedOptionColumn({
    id: "salesOwner",
    header: t("columns.salesOwner"),
    options: members,
    pick: (booking: BookingDto) => booking.salesOwnerId,
  }),
];

/** Reference (link), customer, type, salesperson, status and time of a booking. */
export function useBookingColumns({
  seriesTotals,
  statuses,
  customers,
  members,
  types,
}: BookingLookups): Column[] {
  const t = useTranslations("booking");
  const format = useFormatter();
  return useMemo<Column[]>(
    () => [
      referenceColumn({ t, seriesTotals }),
      ...namedColumns({ t, customers, members, types }),
      statusColumn({ t, statuses }),
      whenColumn({ t, format }),
    ],
    [t, format, customers, members, types, statuses, seriesTotals],
  );
}
