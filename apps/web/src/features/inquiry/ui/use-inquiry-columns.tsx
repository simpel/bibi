import type { InquiryDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import type { ColumnDef } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { namedOptionColumn } from "@/components/data-table/named-option-column";
import { type NamedOption, nameOf } from "@/components/form/named-option";
import { inquiryRoute } from "@/lib/routes";
import { desiredPeriod } from "./desired-period";
import { InquiryStatusBadge } from "./inquiry-status-badge";

type Column = ColumnDef<InquiryDto>;

export type InquiryLookups = {
  customers: NamedOption[];
  members: NamedOption[];
  types: NamedOption[];
};

type Translate = ReturnType<typeof useTranslations<"inquiry">>;
type Format = ReturnType<typeof useFormatter>;

const customerColumn = ({ t, customers }: { t: Translate; customers: NamedOption[] }): Column => ({
  id: "customer",
  header: t("columns.customer"),
  accessorFn: (i) => nameOf({ options: customers, id: i.customerId }),
  cell: ({ row: { original: i } }) => (
    <Link href={inquiryRoute({ id: i.id })} className="font-medium hover:underline">
      {nameOf({ options: customers, id: i.customerId })}
    </Link>
  ),
});

const namedColumns = ({
  t,
  members,
  types,
}: Omit<InquiryLookups, "customers"> & { t: Translate }) => [
  namedOptionColumn({
    id: "type",
    header: t("columns.type"),
    options: types,
    pick: (inquiry: InquiryDto) => inquiry.entityTypeId,
  }),
  namedOptionColumn({
    id: "salesOwner",
    header: t("columns.salesOwner"),
    options: members,
    pick: (inquiry: InquiryDto) => inquiry.salesOwnerId,
  }),
];

type DetailInput = {
  t: Translate;
  statuses: (key: InquiryDto["inquiryStatus"]) => string;
  format: Format;
};

const detailColumns = ({ t, statuses, format }: DetailInput): Column[] => [
  {
    id: "status",
    header: t("columns.status"),
    accessorFn: (i) => statuses(i.inquiryStatus),
    cell: ({ row }) => <InquiryStatusBadge status={row.original.inquiryStatus} />,
  },
  {
    id: "when",
    header: t("columns.when"),
    accessorFn: (i) => i.desiredStartsAt ?? i.desiredEndsAt,
    cell: ({ row }) => desiredPeriod({ inquiry: row.original, format }),
  },
  { id: "quantity", header: t("columns.quantity"), accessorFn: (i) => i.quantity },
];

/** Customer (link), type, salesperson, status, desired dates and quantity of an inquiry. */
export function useInquiryColumns({ customers, members, types }: InquiryLookups): Column[] {
  const t = useTranslations("inquiry");
  const statuses = useTranslations("inquiry.statuses");
  const format = useFormatter();
  return useMemo<Column[]>(
    () => [
      customerColumn({ t, customers }),
      ...namedColumns({ t, members, types }),
      ...detailColumns({ t, statuses, format }),
    ],
    [t, statuses, format, customers, members, types],
  );
}
