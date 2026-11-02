import { actionsColumn, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useNumberFormat } from "@/lib/number/use-number-format";
import type { DraftLine } from "./draft-line";
import { AvailabilityCell, type DraftLineRow, LineActions, LineNameCell } from "./draft-line-cells";
import { lineCostMinor, linesTotalMinor } from "./line-cost";
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
    footer: () => t("total"),
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
  /** The preview's lines in the table's order: the costs and their total. */
  planned: readonly DraftLineRow["planned"][];
  availabilityHidden: boolean;
  onEdit: (input: { line: DraftLine }) => void;
  onRemove: (input: { key: string }) => void;
};

type Money = ReturnType<typeof useNumberFormat>["money"];

type CostColumnInput = { t: Translate; money: Money; total: number | null };

/** The unit price in effect (line, else the customer's price list, else the item). */
const unitPriceColumn = ({ t, money }: Omit<CostColumnInput, "total">): Column => ({
  id: "unitPrice",
  header: t("unitPrice"),
  accessorFn: (row) => row.planned?.effectiveUnitPriceMinor ?? -1,
  cell: ({ row }) => {
    const price = row.original.planned?.effectiveUnitPriceMinor ?? null;
    return <span className="tabular-nums">{price === null ? "–" : money({ minor: price })}</span>;
  },
});

/** Each line's cost (discounts included) and the booking's total in the footer. */
const costColumn = ({ t, money, total }: CostColumnInput): Column => ({
  id: "cost",
  header: t("cost"),
  accessorFn: (row) => lineCostMinor({ planned: row.planned }) ?? -1,
  cell: ({ row }) => {
    const cost = lineCostMinor({ planned: row.original.planned });
    return <span className="tabular-nums">{cost === null ? "–" : money({ minor: cost })}</span>;
  },
  footer: () => (
    <span className="tabular-nums">{total === null ? "–" : money({ minor: total })}</span>
  ),
});

type StateColumnsInput = { t: Translate; headcount: number; availabilityHidden: boolean };

/** The quantity ("12 (guests)" while it follows the headcount) and the availability. */
const stateColumns = ({ t, headcount, availabilityHidden }: StateColumnsInput): Column[] => [
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
];

/** Line · time · quantity · availability · unit price · cost, then Edit (spec "Lines table"). */
export function useDraftLineColumns({
  headcount,
  planned,
  availabilityHidden,
  onEdit,
  onRemove,
}: UseDraftLineColumnsInput): Column[] {
  const t = useTranslations("ticketIntake.lines");
  const common = useTranslations("common");
  const { money } = useNumberFormat();
  const known = planned.every((line) => line !== null)
    ? planned.filter((line) => line !== null)
    : null;
  const total = linesTotalMinor({ planned: known });
  return useMemo<Column[]>(
    () => [
      ...lineColumns({ t }),
      ...stateColumns({ t, headcount, availabilityHidden }),
      unitPriceColumn({ t, money }),
      costColumn({ t, money, total }),
      actionsColumn<DraftLineRow>({
        label: common("actions"),
        cell: (row) => <LineActions row={row} onEdit={onEdit} onRemove={onRemove} />,
      }),
    ],
    [t, common, money, total, headcount, availabilityHidden, onEdit, onRemove],
  );
}
