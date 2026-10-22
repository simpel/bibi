import type { TicketDto } from "@bibi/core";
import type { TicketPhaseDto } from "@bibi/core/schemas";
import type { ColumnDef } from "@bibi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { namedOptionColumn } from "@/components/data-table/named-option-column";
import type { NamedOption } from "@/components/form/named-option";
import { desiredPeriod } from "./desired-period";
import { TicketPhaseLabel } from "./ticket-phase-label";
import { TicketReferenceCell } from "./ticket-reference-cell";

type Column = ColumnDef<TicketDto>;
type Translate = ReturnType<typeof useTranslations<"ticket">>;
type Format = ReturnType<typeof useFormatter>;

export type TicketLookups = {
  customers: NamedOption[];
  /** The caller may not view customers: the column shows "Hidden". */
  customersHidden?: boolean;
  types: NamedOption[];
  phases: TicketPhaseDto[];
};

const referenceColumn = ({ t }: { t: Translate }): Column => ({
  id: "reference",
  header: t("columns.reference"),
  accessorFn: (ticket) => ticket.reference,
  cell: ({ row: { original: ticket } }) => (
    <TicketReferenceCell
      ticket={ticket}
      reference={t("reference", { reference: ticket.reference })}
    />
  ),
});

const phaseColumn = ({ t, phases }: { t: Translate; phases: TicketPhaseDto[] }): Column => ({
  id: "phase",
  header: t("columns.phase"),
  accessorFn: (ticket) => phases.find(({ id }) => id === ticket.phaseId)?.name ?? "",
  cell: ({ row }) => <TicketPhaseLabel phases={phases} id={row.original.phaseId} />,
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

/** Reference (link), customer, type, phase, desired period and quantity of a ticket. */
export function useTicketColumns({
  phases,
  customers,
  customersHidden,
  types,
}: TicketLookups): Column[] {
  const t = useTranslations("ticket");
  const common = useTranslations("common");
  const shown = customersHidden ? common("hidden") : undefined;
  const format = useFormatter();
  return useMemo<Column[]>(
    () => [
      referenceColumn({ t }),
      ...namedColumns({ t, customers, types, hidden: shown }),
      phaseColumn({ t, phases }),
      whenColumn({ t, format }),
      quantityColumn({ t }),
    ],
    [t, format, customers, types, phases, shown],
  );
}
