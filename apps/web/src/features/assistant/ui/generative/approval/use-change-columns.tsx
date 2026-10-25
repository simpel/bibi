import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useNumberFormat } from "@/lib/number/use-number-format";
import type { DescribedChange, DescribedValue, PathSegment } from "../../../lib/describe-change";

/** One row of the change table: a field of a record, before and after. */
export type ChangeRow = DescribedChange & { id: string; record: string };

function useValueText() {
  const t = useTranslations("assistant.approval");
  const { money } = useNumberFormat();
  return ({ value }: { value: DescribedValue }) => {
    if (value.kind === "empty") return t("changes.empty");
    if (value.kind === "money") return money({ minor: value.minor });
    return value.text;
  };
}

function usePathText() {
  const t = useTranslations("assistant.approval");
  return ({ segments }: { segments: PathSegment[] }) =>
    segments
      .map((segment) => (segment.kind === "field" ? t(`fields.${segment.key}`) : segment.text))
      .join(" · ");
}

/** Columns of the approval card's change table (ADR 0049): record, field, before, after. */
export function useChangeColumns({ records }: { records: number }): ColumnDef<ChangeRow>[] {
  const t = useTranslations("assistant.approval.changes");
  const value = useValueText();
  const path = usePathText();
  return useMemo<ColumnDef<ChangeRow>[]>(
    () => [
      ...(records > 1
        ? [{ id: "record", header: t("record"), accessorFn: (row: ChangeRow) => row.record }]
        : []),
      { id: "field", header: t("field"), accessorFn: (row) => path({ segments: row.segments }) },
      {
        id: "before",
        header: t("before"),
        accessorFn: (row) => value({ value: row.before }),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground line-through">{String(getValue())}</span>
        ),
      },
      {
        id: "after",
        header: t("after"),
        accessorFn: (row) => value({ value: row.after }),
        cell: ({ getValue }) => <span className="font-medium">{String(getValue())}</span>,
      },
    ],
    [t, value, path, records],
  );
}
