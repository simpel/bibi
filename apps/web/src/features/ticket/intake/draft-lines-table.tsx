import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { DraftLine } from "./draft-line";
import type { DraftLineRow } from "./draft-line-cells";
import { lineDetails } from "./line-details";
import { useDraftLineColumns } from "./use-draft-line-columns";
import type { ReviewModel } from "./use-review-model";

export type DraftLinesTableProps = {
  model: ReviewModel;
  onEdit: (input: { line: DraftLine }) => void;
};

/** The booking's draft lines with their availability from the preview (spec "Lines table"). */
export function DraftLinesTable({ model, onEdit }: DraftLinesTableProps) {
  const t = useTranslations("ticketIntake.lines");
  const dates = useDateTimeFormat();
  const { catalog } = model.data;
  const hidden = model.preview.status === "ready" && model.preview.availabilityHidden;
  const columns = useDraftLineColumns({
    headcount: model.when.guests,
    availabilityHidden: hidden,
    onEdit,
  });
  const rows: DraftLineRow[] = model.review.lines.map((line, index) => ({
    line,
    planned: model.planned?.[index] ?? null,
    details: lineDetails({ line, items: catalog.items, needValues: catalog.needValues }),
    time:
      line.startsAt && line.endsAt
        ? dates.timeRange({ start: new Date(line.startsAt), end: new Date(line.endsAt) })
        : "",
  }));
  return (
    <PersistedDataTable
      tableId="ticket.intake.lines"
      columns={columns}
      data={rows}
      getRowId={(row) => row.line.key}
      emptyText={t("empty")}
    />
  );
}
