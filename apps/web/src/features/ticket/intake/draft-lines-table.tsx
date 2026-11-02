import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { DraftLine } from "./draft-line";
import { reviewRows } from "./review-rows";
import { useDraftLineColumns } from "./use-draft-line-columns";
import type { ReviewModel } from "./use-review-model";

export type DraftLinesTableProps = {
  model: ReviewModel;
  onEdit: (input: { line: DraftLine }) => void;
  onRemove: (input: { key: string }) => void;
};

/**
 * The booking's draft lines with their availability from the preview, each line's add-ons nested
 * under it (spec "Lines table", ADR 0088).
 */
export function DraftLinesTable({ model, onEdit, onRemove }: DraftLinesTableProps) {
  const t = useTranslations("ticketIntake.lines");
  const dates = useDateTimeFormat();
  const { catalog } = model.data;
  const hidden = model.preview.status === "ready" && model.preview.availabilityHidden;
  const columns = useDraftLineColumns({
    planned: model.review.lines.map((_, index) => model.planned?.[index] ?? null),
    availabilityHidden: hidden,
    onEdit,
    onRemove,
  });
  const rows = reviewRows({
    ...{ lines: model.review.lines, planned: model.planned, headcount: model.when.guests },
    ...{ items: catalog.items, needValues: catalog.needValues, timeRange: dates.timeRange },
  });
  return (
    <PersistedDataTable
      tableId="ticket.intake.lines"
      columns={columns}
      data={rows}
      getRowId={(row) => row.key}
      emptyText={t("empty")}
    />
  );
}
