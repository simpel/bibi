import type { LineDto } from "@okazi/core";
import { actionsColumn, type ColumnDef } from "@okazi/ui";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { nameOf } from "@/components/form/named-option";
import { LineStateCell, stateOf } from "./line-state-cell";
import { placeOf } from "./place-of";
import { amountColumns } from "./program-amount-columns";
import type { ProgramFormData } from "./program-form-data";
import { ProgramRowActions } from "./program-row-actions";

type Translator = ReturnType<typeof useTranslations<"line">>;
type Formatter = ReturnType<typeof useFormatter>;
type Column = ColumnDef<LineDto>;

export type UseProgramColumnsInput = { data: ProgramFormData; canWrite: boolean };

type DataInput = { data: ProgramFormData; t: Translator; format: Formatter; locale: string };

/** The data columns (without the row actions). */
function dataColumns({ data, t, format, locale }: DataInput): Column[] {
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
      accessorFn: (item) => placeOf({ line: item, data }),
    },
    {
      id: "state",
      header: t("columns.state"),
      accessorFn: (item) => stateOf({ item, data })?.name,
      cell: ({ row: { original } }) => <LineStateCell line={original} data={data} />,
    },
    {
      id: "time",
      header: t("columns.time"),
      accessorFn: (item) => item.startsAt ?? undefined,
      cell: ({ row: { original } }) => (
        <span className="whitespace-nowrap">
          {original.startsAt && original.endsAt
            ? format.dateTimeRange(original.startsAt, original.endsAt, {
                dateStyle: "short",
                timeStyle: "short",
              })
            : t("untimed")}
        </span>
      ),
    },
    ...amountColumns({ t, locale }),
  ];
}

/** Name · type · where · state · time · quantity · unit price, plus the row actions when writable. */
export function useProgramColumns({ data, canWrite }: UseProgramColumnsInput): Column[] {
  const t = useTranslations("line");
  const common = useTranslations("common");
  const format = useFormatter();
  const locale = useLocale();
  return useMemo<Column[]>(() => {
    const columns = dataColumns({ data, t, format, locale });
    if (!canWrite) return columns;
    return [
      ...columns,
      actionsColumn<LineDto>({
        label: common("actions"),
        cell: (item) => <ProgramRowActions line={item} data={data} />,
      }),
    ];
  }, [t, common, format, locale, data, canWrite]);
}
