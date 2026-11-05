"use client";

import type { RunSheetDefinitionDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RowAccess } from "@/lib/can";
import type { RunSheetOptions } from "./run-sheet-options";
import { useRunSheetDefinitionColumns } from "./use-run-sheet-definition-columns";

export type RunSheetDefinitionTableProps = {
  runSheets: RunSheetDefinitionDto[];
  options: RunSheetOptions;
  access: RowAccess;
};

/** The organization's run sheets: what each includes and which role it goes to. */
export function RunSheetDefinitionTable({
  runSheets,
  options,
  access,
}: RunSheetDefinitionTableProps) {
  const t = useTranslations("runSheetDefinition");
  const columns = useRunSheetDefinitionColumns({ options, access });
  return (
    <PersistedDataTable
      tableId="run-sheet-definition.list"
      columns={columns}
      data={runSheets}
      getRowId={(runSheet) => runSheet.id}
      emptyText={t("empty")}
    />
  );
}
