import type { OptionDto } from "@okazi/core";
import { actionsColumn, type ColumnDef } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { OptionRowActions } from "./option-row-actions";
import { OptionStatusBadge } from "./option-status-badge";

type Column = ColumnDef<OptionDto>;

type Translate = ReturnType<typeof useTranslations<"option">>;
type Format = ReturnType<typeof useFormatter>;

type WhenColumnInput = {
  id: "startsAt" | "endsAt" | "expiresAt";
  t: Translate;
  format: Format;
  pick: (option: OptionDto) => Date;
};

const whenColumn = ({ id, t, format, pick }: WhenColumnInput): Column => ({
  id,
  header: t(`columns.${id}`),
  accessorFn: (option) => pick(option),
  cell: ({ row }) =>
    format.dateTime(pick(row.original), { dateStyle: "medium", timeStyle: "short" }),
});

export type UseOptionColumnsInput = { canWrite: boolean };

/** Rank · start · end · expiry · note, plus the row actions when the caller can write. */
export function useOptionColumns({ canWrite }: UseOptionColumnsInput): Column[] {
  const t = useTranslations("option");
  const common = useTranslations("common");
  const format = useFormatter();
  return useMemo<Column[]>(() => {
    const data: Column[] = [
      {
        id: "rank",
        header: t("columns.rank"),
        accessorFn: (option) => option.rank ?? Number.MAX_SAFE_INTEGER,
        cell: ({ row }) => (
          <OptionStatusBadge status={row.original.optionStatus} rank={row.original.rank} />
        ),
      },
      whenColumn({ id: "startsAt", t, format, pick: (option) => option.startsAt }),
      whenColumn({ id: "endsAt", t, format, pick: (option) => option.endsAt }),
      whenColumn({ id: "expiresAt", t, format, pick: (option) => option.expiresAt }),
      {
        id: "note",
        header: t("columns.note"),
        accessorFn: (option) => option.note ?? "",
        cell: ({ row }) => row.original.note ?? "–",
      },
    ];
    if (!canWrite) return data;
    return [
      ...data,
      actionsColumn<OptionDto>({
        label: common("actions"),
        cell: (option) => <OptionRowActions option={option} />,
      }),
    ];
  }, [t, common, format, canWrite]);
}
