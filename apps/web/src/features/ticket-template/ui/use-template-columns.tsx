import type { TicketTemplateDto } from "@bibi/core/schemas";
import { actionsColumn, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { nameOf } from "@/components/form/named-option";
import type { RowAccess } from "@/lib/can";
import { TicketTemplateRowActions } from "./ticket-template-row-actions";

type Column = ColumnDef<TicketTemplateDto>;

export type TemplateColumnsInput = {
  statuses: readonly NamedOption[];
  types: readonly NamedOption[];
  access: RowAccess;
};

/** Name, ticket type, start status and line count; admins also get the row actions. */
export function useTemplateColumns({ statuses, types, access }: TemplateColumnsInput): Column[] {
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
        id: "status",
        header: t("columns.status"),
        accessorFn: (row) => nameOf({ options: statuses, id: row.statusId }),
      },
      {
        id: "lines",
        header: t("columns.lines"),
        accessorFn: (row) => row.lines.length,
      },
    ];
    if (!access.canEdit && !access.canRemove) return columns;
    const actions = actionsColumn<TicketTemplateDto>({
      label: common("actions"),
      cell: (template) => <TicketTemplateRowActions template={template} access={access} />,
    });
    return [...columns, actions];
  }, [t, common, statuses, types, access]);
}
