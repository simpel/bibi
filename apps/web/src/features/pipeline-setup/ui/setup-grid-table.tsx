import type { PipelineCellDraft } from "@okazi/core/schemas";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { SetupPhaseValues, SetupTypeValues } from "./setup-form-schema";
import { useSetupGridColumns } from "./use-setup-grid-columns";

export type SetupGridTableProps = {
  phases: SetupPhaseValues[];
  itemTypes: SetupTypeValues[];
  cells: PipelineCellDraft[];
  onChange: (cells: PipelineCellDraft[]) => void;
};

/** The draft's grid as a table; a terminal phase releases every line, so it has no cells. */
export function SetupGridTable({ phases, itemTypes, cells, onChange }: SetupGridTableProps) {
  const t = useTranslations("phaseGrid");
  const columns = useSetupGridColumns({ itemTypes, cells, onChange });
  return (
    <PersistedDataTable
      tableId="pipeline-setup.grid"
      columns={columns}
      data={phases}
      getRowId={(phase) => phase.name}
      emptyText={t("empty")}
    />
  );
}
