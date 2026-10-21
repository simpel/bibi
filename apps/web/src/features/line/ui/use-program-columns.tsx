import type { LineDto } from "@okazi/core";
import { actionsColumn, type ColumnDef } from "@okazi/ui";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { nameOf } from "@/components/form/named-option";
import { chosenOptions } from "./choose-options-schema";
import { LineStateCell, stateOf } from "./line-state-cell";
import { placeOf } from "./place-of";
import { amountColumns } from "./program-amount-columns";
import type { ProgramFormData } from "./program-form-data";
import { nameColumn } from "./program-name-column";
import { type ProgramAccess, ProgramRowActions } from "./program-row-actions";

type Translator = ReturnType<typeof useTranslations<"line">>;
type EffectTranslator = ReturnType<typeof useTranslations<"priceEffect">>;
type Formatter = ReturnType<typeof useFormatter>;
type Column = ColumnDef<LineDto>;

export type UseProgramColumnsInput = {
  lines: LineDto[];
  data: ProgramFormData;
  access: ProgramAccess;
};

type DataInput = {
  data: ProgramFormData;
  t: Translator;
  effects: EffectTranslator;
  format: Formatter;
  locale: string;
  hidden: string | undefined;
};

/** The data columns (without the row actions). */
function dataColumns({ data, t, effects, format, locale, hidden }: DataInput): Column[] {
  return [
    nameColumn({ t, effects }),
    {
      id: "type",
      header: t("columns.type"),
      accessorFn: (item) => nameOf({ options: data.types, id: item.entityTypeId }),
    },
    {
      id: "where",
      header: t("columns.where"),
      accessorFn: (item) => placeOf({ line: item, data, hidden }),
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
export function useProgramColumns({ lines, data, access }: UseProgramColumnsInput): Column[] {
  const t = useTranslations("line");
  const effects = useTranslations("priceEffect");
  const common = useTranslations("common");
  const format = useFormatter();
  const locale = useLocale();
  return useMemo<Column[]>(() => {
    const hidden = data.itemsHidden ? common("hidden") : undefined;
    const columns = dataColumns({ data, t, effects, format, locale, hidden });
    if (!access.canEdit && !access.canRemove && !access.canChangeState) return columns;
    return [
      ...columns,
      actionsColumn<LineDto>({
        label: common("actions"),
        cell: (item) => (
          <ProgramRowActions
            line={item}
            data={data}
            access={access}
            chosen={chosenOptions({ line: item, lines })}
          />
        ),
      }),
    ];
  }, [t, effects, common, format, locale, lines, data, access]);
}
