import type { TicketDto } from "@bibi/core";
import type { DateTimeFormat, TicketStatusDto } from "@bibi/core/schemas";
import { Avatar, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { namedOptionColumn } from "@/components/data-table/named-option-column";
import type { NamedOption } from "@/components/form/named-option";
import { ticketName } from "@/lib/ticket-label";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { desiredPeriod } from "./desired-period";
import { TicketStatusDot } from "./ticket-status-dot";
import { TicketTitleCell } from "./ticket-title-cell";

type Column = ColumnDef<TicketDto>;
type Translate = ReturnType<typeof useTranslations<"ticket">>;
type Format = DateTimeFormat;

export type TicketLookups = {
  customers: NamedOption[];
  /** The caller may not view customers: the column shows "Hidden". */
  customersHidden?: boolean;
  types: NamedOption[];
  statuses: TicketStatusDto[];
  /** Members who can be assigned (`id` = user id). */
  members: NamedOption[];
};

const titleColumn = ({ t }: { t: Translate }): Column => ({
  id: "title",
  header: t("columns.title"),
  // Untitled tickets sort by their reference label.
  accessorFn: (ticket) => ticket.title ?? `#${ticket.reference}`,
  cell: ({ row: { original: ticket } }) => (
    <TicketTitleCell
      ticket={ticket}
      title={ticketName({
        title: ticket.title,
        fallback: t("reference", { reference: ticket.reference }),
      })}
    />
  ),
});

const statusColumn = ({ t, statuses }: { t: Translate; statuses: TicketStatusDto[] }): Column => ({
  id: "status",
  header: t("columns.status"),
  accessorFn: (ticket) => statuses.find(({ id }) => id === ticket.statusId)?.name ?? "",
  cell: ({ row }) => <TicketStatusDot statuses={statuses} id={row.original.statusId} />,
});

type AssigneeInput = { t: Translate; members: NamedOption[] };

/** The main assignee with their initials; not sortable, since the server cannot order by it. */
const assigneeColumn = ({ t, members }: AssigneeInput): Column => ({
  id: "assignee",
  header: t("columns.assignee"),
  enableSorting: false,
  accessorFn: (ticket) => members.find(({ id }) => id === ticket.assigneeId)?.name ?? "",
  cell: ({ getValue }) => {
    const name = getValue() as string;
    if (!name) return "–";
    return (
      <span className="flex items-center gap-2">
        <Avatar size="sm" name={name} photoUrl={null} />
        {name}
      </span>
    );
  },
});

const whenColumn = ({ t, format }: { t: Translate; format: Format }): Column => ({
  id: "when",
  header: t("columns.when"),
  accessorFn: (ticket) => ticket.desiredStartsAt,
  cell: ({ row: { original: ticket } }) => desiredPeriod({ ticket, format }),
});

const quantityColumn = ({ t }: { t: Translate }): Column => ({
  id: "quantity",
  header: t("columns.quantity"),
  accessorFn: (ticket) => ticket.guaranteedHeadcount ?? ticket.estimatedHeadcount,
  cell: ({ getValue }) => (getValue() as number | null) ?? "–",
});

type NamedInput = Pick<TicketLookups, "customers" | "types"> & {
  t: Translate;
  hidden: string | undefined;
};

const namedColumns = ({ t, customers, types, hidden }: NamedInput): Column[] => [
  namedOptionColumn({
    id: "customer",
    header: t("columns.customer"),
    options: customers,
    hidden,
    pick: (ticket: TicketDto) => ticket.customerId,
  }),
  namedOptionColumn({
    id: "type",
    header: t("columns.type"),
    options: types,
    pick: (ticket: TicketDto) => ticket.entityTypeId,
  }),
];

/**
 * Status (its color, the name on hover) first, then title (link), customer, type, assignee,
 * desired period and quantity of a ticket.
 */
export function useTicketColumns({
  statuses,
  customers,
  customersHidden,
  types,
  members,
}: TicketLookups): Column[] {
  const t = useTranslations("ticket");
  const common = useTranslations("common");
  const shown = customersHidden ? common("hidden") : undefined;
  const format = useDateTimeFormat();
  return useMemo<Column[]>(
    () => [
      statusColumn({ t, statuses }),
      titleColumn({ t }),
      ...namedColumns({ t, customers, types, hidden: shown }),
      assigneeColumn({ t, members }),
      whenColumn({ t, format }),
      quantityColumn({ t }),
    ],
    [t, format, customers, types, members, statuses, shown],
  );
}
