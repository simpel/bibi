import type { OrderStatusDto } from "@bibi/core/schemas";
import { actionsColumn, Badge, ColorSwatch, type ColumnDef, createTableColumns } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { RowAccess } from "@/lib/can";
import { Link } from "@/lib/navigation";
import { OrderStatusRowActions, orderStatusEditHref } from "./order-status-row-actions";
import type { StatusRow } from "./status-rows";

type Column = ColumnDef<StatusRow>;

type Translate = ReturnType<typeof useTranslations<"orderStatus">>;

/** The flags a status has, as badges (ADR 0043). */
const flagsColumn = ({ t }: { t: Translate }): Column => ({
  id: "flags",
  header: t("columns.flags"),
  accessorFn: (row) => row.flags.map((flag) => t(`flags.${flag}`)).join(", "),
  cell: ({ row: { original: row } }) => (
    <span className="flex flex-wrap gap-1">
      {row.flags.map((flag) => (
        <Badge key={flag} variant="outline">
          {t(`flags.${flag}`)}
        </Badge>
      ))}
    </span>
  ),
});

/** Where a status's orders may move: nowhere (closing), any status, or the chosen ones. */
export const movesText = ({ row, t }: { row: StatusRow; t: Translate }) => {
  if (row.closes) return t("noTransitions");
  return row.restrictsNext ? row.targets.join(", ") || t("noTransitions") : t("anyStatus");
};

export type StatusColumnsInput = { statuses: OrderStatusDto[]; access: RowAccess };

function StatusName({ row, canEdit }: { row: StatusRow; canEdit: boolean }) {
  const { orderStatus } = row;
  const label = (
    <span className="inline-flex items-center gap-2 font-medium">
      <ColorSwatch color={orderStatus.color} />
      {orderStatus.name}
    </span>
  );
  if (!canEdit) return label;
  return (
    <Link href={orderStatusEditHref({ id: orderStatus.id })} className="hover:underline">
      {label}
    </Link>
  );
}

/** Name (with color), flags and allowed transitions; admins also get the row actions. */
export function useStatusColumns({ statuses, access }: StatusColumnsInput): Column[] {
  const t = useTranslations("orderStatus");
  const common = useTranslations("common");
  return useMemo<Column[]>(
    () =>
      createTableColumns<StatusRow>({
        primary: [
          {
            id: "name",
            header: t("columns.name"),
            accessorFn: (row) => row.orderStatus.name,
            cell: ({ row }) => <StatusName row={row.original} canEdit={access.canEdit} />,
          },
        ],
        relations: [
          flagsColumn({ t }),
          {
            id: "transitions",
            header: t("columns.transitions"),
            accessorFn: (row) => movesText({ row, t }),
          },
        ],
        actions:
          access.canEdit || access.canRemove
            ? [
                actionsColumn<StatusRow>({
                  label: common("actions"),
                  cell: ({ orderStatus, index }) => (
                    <OrderStatusRowActions
                      orderStatus={orderStatus}
                      index={index}
                      statuses={statuses}
                      access={access}
                    />
                  ),
                }),
              ]
            : [],
      }),
    [t, common, statuses, access],
  );
}
