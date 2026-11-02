import { actionsColumn, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { DraftLine } from "./draft-line";
import { AvailabilityCell, type DraftLineRow, LineActions, LineNameCell } from "./draft-line-cells";
import { lineTone } from "./use-issue-text";

type Column = ColumnDef<DraftLineRow>;

const TONE_ORDER = { clash: 0, warn: 1, ok: 2, unknown: 3 } as const;

type Translate = ReturnType<typeof useTranslations<"ticketIntake.lines">>;

/** The line's name with its details, then its time. */
const lineColumns = ({ t }: { t: Translate }): Column[] => [
  {
    id: "line",
    header: t("line"),
    accessorFn: (row) => row.line.name,
    cell: ({ row }) => <LineNameCell row={row.original} />,
  },
  {
    id: "time",
    header: t("time"),
    accessorFn: (row) => row.line.startsAt ?? "",
    cell: ({ row }) => row.original.time || t("untimed"),
  },
];

export type UseDraftLineColumnsInput = {
  headcount: number;
  availabilityHidden: boolean;
  onEdit: (input: { line: DraftLine }) => void;
};

/** Line · time · quantity · availability, then Edit (spec "Lines table"). */
export function useDraftLineColumns({
  headcount,
  availabilityHidden,
  onEdit,
}: UseDraftLineColumnsInput): Column[] {
  const t = useTranslations("ticketIntake.lines");
  const common = useTranslations("common");
  return useMemo<Column[]>(
    () => [
      ...lineColumns({ t }),
      {
        id: "quantity",
        header: t("quantity"),
        accessorFn: (row) => row.line.quantity ?? headcount,
        cell: ({ row }) =>
          row.original.line.quantity === null
            ? t("guests", { count: headcount })
            : row.original.line.quantity,
      },
      {
        id: "availability",
        header: t("availability"),
        accessorFn: (row) => TONE_ORDER[lineTone({ planned: row.planned })],
        cell: ({ row }) => <AvailabilityCell row={row.original} hidden={availabilityHidden} />,
      },
      actionsColumn<DraftLineRow>({
        label: common("actions"),
        cell: (row) => <LineActions row={row} onEdit={onEdit} />,
      }),
    ],
    [t, common, headcount, availabilityHidden, onEdit],
  );
}
