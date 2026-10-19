import type { ProgramItemDto } from "@okazi/core";
import { actionsColumn, type ColumnDef } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { nameOf } from "@/components/form/named-option";
import { LineStateCell, stateOf } from "./line-state-cell";
import { placeOf } from "./place-of";
import type { ProgramFormData } from "./program-form-data";
import { type ProgramAccess, ProgramRowActions } from "./program-row-actions";

type Translator = ReturnType<typeof useTranslations<"programItem">>;
type Formatter = ReturnType<typeof useFormatter>;
type Column = ColumnDef<ProgramItemDto>;

export type UseProgramColumnsInput = { data: ProgramFormData; access: ProgramAccess };

type DataInput = {
  data: ProgramFormData;
  t: Translator;
  format: Formatter;
  hidden: string | undefined;
};

/** The data columns (without the row actions). */
function dataColumns({ data, t, format, hidden }: DataInput): Column[] {
  return [
    { id: "name", header: t("columns.name"), accessorFn: (item) => item.name },
    {
      id: "type",
      header: t("columns.type"),
      accessorFn: (item) => nameOf({ options: data.types, id: item.entityTypeId }),
    },
    {
      id: "where",
      header: t("columns.where"),
      accessorFn: (item) => placeOf({ programItem: item, data, hidden }),
    },
    {
      id: "state",
      header: t("columns.state"),
      accessorFn: (item) => stateOf({ item, data })?.name,
      cell: ({ row: { original } }) => <LineStateCell programItem={original} data={data} />,
    },
    {
      id: "time",
      header: t("columns.time"),
      accessorFn: (item) => item.startsAt,
      cell: ({ row: { original } }) => (
        <span className="whitespace-nowrap">
          {format.dateTimeRange(original.startsAt, original.endsAt, {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </span>
      ),
    },
    {
      id: "quantity",
      header: t("columns.quantity"),
      accessorFn: (item) => item.quantity ?? undefined,
      cell: ({ row }) => row.original.quantity ?? "–",
    },
  ];
}

/** Name · type · where · state · time · quantity, plus the row actions when writable. */
export function useProgramColumns({ data, access }: UseProgramColumnsInput): Column[] {
  const t = useTranslations("programItem");
  const common = useTranslations("common");
  const format = useFormatter();
  return useMemo<Column[]>(() => {
    const hidden = data.itemsHidden ? common("hidden") : undefined;
    const columns = dataColumns({ data, t, format, hidden });
    if (!access.canEdit && !access.canRemove && !access.canChangeState) return columns;
    return [
      ...columns,
      actionsColumn<ProgramItemDto>({
        label: common("actions"),
        cell: (item) => <ProgramRowActions programItem={item} data={data} access={access} />,
      }),
    ];
  }, [t, common, format, data, access]);
}
