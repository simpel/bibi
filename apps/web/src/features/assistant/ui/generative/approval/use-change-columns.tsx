import type { ColumnDef } from "@bibi/ui";
import { Button } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useNumberFormat } from "@/lib/number/use-number-format";
import type { EditKind } from "../../../lib/approval-edits";
import type { DescribedChange, DescribedValue, PathSegment } from "../../../lib/describe-change";
import type { EditTarget } from "./edit-field-dialog";

/** One row of the change table: a field of a record, before and after. */
export type ChangeRow = DescribedChange & {
  id: string;
  record: string;
  path: string;
  /** The raw new value, as the edit dialog starts from it. */
  value: unknown;
  /** How the row is edited, or `null` when it is not editable. */
  editKind: EditKind | null;
};

function useValueText() {
  const t = useTranslations("assistant.approval");
  const { money } = useNumberFormat();
  return ({ value }: { value: DescribedValue }) => {
    if (value.kind === "empty") return t("changes.empty");
    if (value.kind === "money") return money({ minor: value.minor });
    if (value.kind === "yesNo") return value.value ? t("changes.yes") : t("changes.no");
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

export type UseChangeColumnsInput = {
  records: number;
  /** Adds a pen per editable row; absent once the proposal is decided. */
  onEdit?: (target: EditTarget) => void;
};

/** Columns of the approval card's change table (ADR 0049): record, field, before, after, pen. */
export function useChangeColumns({
  records,
  onEdit,
}: UseChangeColumnsInput): ColumnDef<ChangeRow>[] {
  const t = useTranslations("assistant.approval.changes");
  const edit = useTranslations("assistant.approval.edit");
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
      ...(onEdit
        ? [
            {
              id: "edit",
              header: () => <span className="sr-only">{edit("column")}</span>,
              enableSorting: false,
              cell: ({ row }: { row: { original: ChangeRow } }) => {
                const { editKind: kind, path: key, value: raw, segments } = row.original;
                if (!kind) return null;
                const label = path({ segments });
                return (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    aria-label={edit("title", { field: label })}
                    onClick={() => onEdit({ path: key, label, kind, value: raw })}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                );
              },
            } satisfies ColumnDef<ChangeRow>,
          ]
        : []),
    ],
    [t, edit, value, path, records, onEdit],
  );
}
