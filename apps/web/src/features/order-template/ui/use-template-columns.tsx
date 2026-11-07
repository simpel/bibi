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
import type { RowAccess } from "@/lib/can";
import { Link } from "@/lib/navigation";
import { OrderTemplateRowActions, orderTemplateEditHref } from "./order-template-row-actions";

const guestRange = ({ min, max }: { min: number | null; max: number | null }) => {
  if (min === null && max === null) return "–";
  if (min === null) return `≤ ${max}`;
  if (max === null) return `≥ ${min}`;
  return min === max ? String(min) : `${min}–${max}`;
};

type Column = ColumnDef<OrderTemplateDto>;
type StatusOption = NamedOption & { color?: string | undefined };

export type TemplateColumnsInput = {
  statuses: readonly StatusOption[];
  types: readonly NamedOption[];
  access: RowAccess;
};

/** Name, order type, start status, guest range and line count; admins also get the row actions. */
export function useTemplateColumns({ statuses, types, access }: TemplateColumnsInput): Column[] {
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
            cell: ({ row }) =>
              access.canEdit ? (
                <Link
                  href={orderTemplateEditHref({ id: row.original.id })}
                  className="font-medium hover:underline"
                >
                  {row.original.name}
                </Link>
              ) : (
                <span className="font-medium">{row.original.name}</span>
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
        actions:
          access.canEdit || access.canRemove
            ? [
                actionsColumn<OrderTemplateDto>({
                  label: common("actions"),
                  cell: (template) => (
                    <OrderTemplateRowActions template={template} access={access} />
                  ),
                }),
              ]
            : [],
      }),
    [t, common, statuses, types, access],
  );
}
