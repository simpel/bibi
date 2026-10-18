import type { PipelinePreviewStep } from "@okazi/core/schemas";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { usePreviewColumns } from "./use-preview-columns";

export type PreviewTableProps = { steps: PipelinePreviewStep[]; tableId: string };

/** The simulated ticket phase by phase: each line's state and hold. */
export function PreviewTable({ steps, tableId }: PreviewTableProps) {
  const t = useTranslations("pipelineSetup.preview");
  const columns = usePreviewColumns({ types: steps[0]?.lines.map((line) => line.type) ?? [] });
  return (
    <PersistedDataTable
      tableId={tableId}
      columns={columns}
      data={steps}
      getRowId={(step) => step.phase}
      emptyText={t("empty")}
    />
  );
}
