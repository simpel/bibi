import type { OrderTemplateDto } from "@bibi/core/schemas";
import {
  actionsColumn,
  type ColumnDef,
  createTableColumns,
  numberColumn,
  statusColumn,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { nameOf } from "@/components/form/named-option";
import { Link } from "@/lib/navigation";
import { guestRange } from "../lib/guest-range";
import { orderTemplateHref } from "../template-route";
import { OrderTemplateRowActions } from "./order-template-row-actions";

type Column = ColumnDef<OrderTemplateDto>;
type StatusOption = NamedOption & { color?: string | undefined };

export type TemplateColumnsInput = {
  statuses: readonly StatusOption[];
  types: readonly NamedOption[];
};

/** Name, order type, start status, guest range, line count and the row action (Open). */
export function useTemplateColumns({ statuses, types }: TemplateColumnsInput): Column[] {
  const t = useTranslations("orderTemplate");
  const common = useTranslations("common");
  return useMemo<Column[]>(
    () =>
      createTableColumns<OrderTemplateDto>({
        primary: [
          {
            id: "name",
            header: t("columns.name"),
            accessorFn: (row) => row.name,
            cell: ({ row }) => (
              <Link
                href={orderTemplateHref({ id: row.original.id })}
                className="font-medium hover:underline"
              >
                {row.original.name}
              </Link>
            ),
          },
        ],
        relations: [
          {
            id: "orderType",
            header: t("columns.orderType"),
            accessorFn: (row) => nameOf({ options: types, id: row.entityTypeId }),
          },
        ],
        status: [
          statusColumn<OrderTemplateDto>({
            header: t("columns.status"),
            getStatus: (row) => {
              const status = statuses.find(({ id }) => id === row.statusId);
              return status ? { label: status.name, color: status.color } : null;
            },
          }),
        ],
        numbers: [
          {
            id: "guests",
            header: t("columns.guests"),
            accessorFn: (row) => guestRange({ min: row.minGuests, max: row.maxGuests }),
          },
          numberColumn<OrderTemplateDto>({
            id: "lines",
            header: t("columns.lines"),
            getValue: (row) => row.lines.length,
          }),
        ],
        actions: [
          actionsColumn<OrderTemplateDto>({
            label: common("actions"),
            cell: (template) => <OrderTemplateRowActions template={template} />,
          }),
        ],
      }),
    [t, common, statuses, types],
  );
}
