import type { TicketTemplateDto } from "@okazi/core/schemas";
import { actionsColumn, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { nameOf } from "@/components/form/named-option";
import { TicketTemplateRowActions } from "./ticket-template-row-actions";

type Column = ColumnDef<TicketTemplateDto>;

export type TemplateColumnsInput = {
  phases: readonly NamedOption[];
  types: readonly NamedOption[];
  canAdmin: boolean;
};

/** Name, ticket type, start phase and line count; admins also get the row actions. */
export function useTemplateColumns({ phases, types, canAdmin }: TemplateColumnsInput): Column[] {
  const t = useTranslations("ticketTemplate");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const columns: Column[] = [
      { id: "name", header: t("columns.name"), accessorFn: (row) => row.name },
      {
        id: "ticketType",
        header: t("columns.ticketType"),
        accessorFn: (row) => nameOf({ options: types, id: row.entityTypeId }),
      },
      {
        id: "phase",
        header: t("columns.phase"),
        accessorFn: (row) => nameOf({ options: phases, id: row.phaseId }),
      },
      {
        id: "lines",
        header: t("columns.lines"),
        accessorFn: (row) => row.lines.length,
      },
    ];
    if (!canAdmin) return columns;
    const actions = actionsColumn<TicketTemplateDto>({
      label: common("actions"),
      cell: (template) => <TicketTemplateRowActions template={template} />,
    });
    return [...columns, actions];
  }, [t, common, phases, types, canAdmin]);
}
