import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { ChangeMark, WorkOrderTaskRow } from "../document-rows";

type Column = ColumnDef<WorkOrderTaskRow>;

/** An included field of the work order: its key in the row's values and its name. */
export type WorkOrderFieldColumn = { key: string; name: string };

export type UseWorkOrderTaskColumnsInput = { fields: readonly WorkOrderFieldColumn[] };

/** ★ for a row added or changed since the last sent version; a removed row is struck through. */
export function ChangeCell({ change }: { change: ChangeMark }) {
  const t = useTranslations("workOrder");
  if (!change) return null;
  const label = t(`change.${change}`);
  return (
    <span role="img" aria-label={label} title={label} className="text-amber-600">
      ★
    </span>
  );
}

function NameCell({ row }: { row: WorkOrderTaskRow }) {
  const t = useTranslations("workOrder");
  const name = row.addOnTo ? t("addOnTo", { name: row.name, parent: row.addOnTo }) : row.name;
  return <span className={row.change === "REMOVED" ? "line-through" : "font-medium"}>{name}</span>;
}

/** ★ · when · what · item · quantity, then one column per included field. */
export function useWorkOrderTaskColumns({ fields }: UseWorkOrderTaskColumnsInput): Column[] {
  const t = useTranslations("workOrder.document.columns");
  return useMemo<Column[]>(
    () => [
      {
        id: "change",
        header: "★",
        accessorFn: (row) => row.change ?? "",
        cell: ({ row }) => <ChangeCell change={row.original.change} />,
      },
      {
        id: "when",
        header: t("when"),
        accessorFn: (row) => row.startsAt ?? "",
        cell: ({ row }) => row.original.when,
      },
      {
        id: "name",
        header: t("name"),
        accessorFn: (row) => row.name,
        cell: ({ row }) => <NameCell row={row.original} />,
      },
      { id: "item", header: t("item"), accessorFn: (row) => row.item },
      { id: "quantity", header: t("quantity"), accessorFn: (row) => row.quantity ?? "" },
      ...fields.map<Column>((field) => ({
        id: `field.${field.key}`,
        header: field.name,
        accessorFn: (row) => row.fields[field.key] ?? "",
      })),
    ],
    [t, fields],
  );
}
