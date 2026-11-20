import type { LineAmounts, LineDto } from "@bibi/core";
import type { DateTimeFormat, NumberFormat } from "@bibi/core/schemas";
import { actionsColumn, type ColumnDef, createTableColumns, DataTableRowActions } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { LineStateCell, stateOf } from "./line-state-cell";
import { placeOf } from "./place-of";
import { amountColumn, amountColumns } from "./program-amount-columns";
import type { ProgramFormData } from "./program-form-data";
import { nameColumn } from "./program-name-column";
import type { ProgramAccess } from "./program-row-actions";
import { ProgramRowMenu, type ProgramRowMenuProps } from "./program-row-menu";

type Translator = ReturnType<typeof useTranslations<"line">>;
type EffectTranslator = ReturnType<typeof useTranslations<"priceEffect">>;
type Column = ColumnDef<LineDto>;

export type UseProgramColumnsInput = {
  data: ProgramFormData;
  access: ProgramAccess;
  amounts: LineAmounts | null;
  pendingLineIds?: Set<string>;
  onStateChange?: (input: { lineId: string; stateId: string }) => void;
  onFollowStatus?: (input: { lineId: string }) => void;
  onEdit?: (line: LineDto) => void;
  /** Opens a row's dialog from its "…" menu; without it the table has no actions column. */
  onOpenDialog?: ProgramRowMenuProps["onOpenDialog"];
  /** After a line's name, e.g. its comments (ADR 0115). */
  nameExtra?: ((line: LineDto) => ReactNode) | undefined;
};

type DataInput = UseProgramColumnsInput & {
  t: Translator;
  effects: EffectTranslator;
  format: DateTimeFormat;
  money: NumberFormat["money"];
  hidden: string | undefined;
};

function stateColumn({
  t,
  data,
  access,
  pendingLineIds,
  onStateChange,
  onFollowStatus,
}: DataInput): Column {
  return {
    id: "state",
    header: t("columns.state"),
    accessorFn: (item) => stateOf({ item, data })?.name ?? "",
    cell: ({ row: { original } }) => (
      <LineStateCell
        line={original}
        data={data}
        pending={pendingLineIds?.has(original.id)}
        canChangeState={access.canChangeState}
        onStateChange={onStateChange}
        onFollowStatus={onFollowStatus}
      />
    ),
  };
}

function timeColumn({ t, format }: { t: Translator; format: DateTimeFormat }): Column {
  return {
    id: "time",
    header: t("columns.time"),
    accessorFn: (item) => item.startsAt ?? undefined,
    cell: ({ row: { original } }) => (
      <span className="whitespace-nowrap">
        {original.startsAt && original.endsAt
          ? format.timeRange({
              start: original.startsAt,
              end: original.endsAt,
              timeZone: original.timeZone,
            })
          : t("untimed")}
      </span>
    ),
  };
}

type RowMenuInput = Omit<ProgramRowMenuProps, "kit" | "line"> & { label: string };

/** The row's "…" menu: every action of the right-click menu (CLAUDE.md "Tables"). */
function rowMenuColumn({ label, ...menu }: RowMenuInput): Column {
  return actionsColumn<LineDto>({
    label,
    cell: (line) => (
      <DataTableRowActions label={label}>
        <ProgramRowMenu kit="dropdown" line={line} {...menu} />
      </DataTableRowActions>
    ),
  });
}

/** Columns for the order program table: Selection · Name · Where · State · Time · Quantity · Total · Actions. */
export function useProgramColumns({
  data,
  access,
  amounts,
  pendingLineIds,
  onStateChange,
  onFollowStatus,
  onEdit,
  onOpenDialog,
  nameExtra,
}: UseProgramColumnsInput): Column[] {
  const t = useTranslations("line");
  const effects = useTranslations("priceEffect");
  const common = useTranslations("common");
  const format = useDateTimeFormat();
  const { money } = useNumberFormat();
  return useMemo<Column[]>(() => {
    const hidden = data.itemsHidden ? common("hidden") : undefined;
    const state = stateColumn({
      data,
      access,
      amounts,
      pendingLineIds,
      onStateChange,
      onFollowStatus,
      onEdit,
      t,
      effects,
      format,
      money,
      hidden,
    });
    return createTableColumns<LineDto>({
      primary: [nameColumn({ t, effects, onEdit, extra: nameExtra })],
      relations: [
        {
          id: "where",
          header: t("columns.where"),
          accessorFn: (item) => placeOf({ line: item, data, hidden }),
        },
      ],
      status: [state],
      dates: [timeColumn({ t, format })],
      numbers: [...amountColumns({ t }), amountColumn({ t, money, amounts })],
      actions:
        onOpenDialog && onStateChange && onFollowStatus
          ? [
              rowMenuColumn({
                ...{ label: common("actions"), data, access },
                ...{ onOpenDialog, onStateChange, onFollowStatus },
              }),
            ]
          : [],
    });
  }, [
    t,
    effects,
    common,
    format,
    money,
    data,
    access,
    amounts,
    pendingLineIds,
    onStateChange,
    onFollowStatus,
    onEdit,
    onOpenDialog,
    nameExtra,
  ]);
}
