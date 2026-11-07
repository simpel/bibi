"use client";

import type { RunSheetDefinitionDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import type { RowAccess } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
import { RunSheetDefinitionRowMenu, runSheetEditHref } from "./run-sheet-definition-row-actions";
import type { RunSheetOptions } from "./run-sheet-options";
import { useRunSheetDefinitionColumns } from "./use-run-sheet-definition-columns";

export type RunSheetDefinitionTableProps = {
  runSheets: RunSheetDefinitionDto[];
  options: RunSheetOptions;
  access: RowAccess;
};

const NO_QUALIFIERS: TableQualifier<RunSheetDefinitionDto>[] = [];

/** The organization's run sheets: what each includes and which role it goes to. */
export function RunSheetDefinitionTable({
  runSheets,
  options,
  access,
}: RunSheetDefinitionTableProps) {
  const t = useTranslations("runSheetDefinition");
  const router = useRouter();
  const columns = useRunSheetDefinitionColumns({ options, access });
  const view = useClientTableView({
    rows: runSheets,
    qualifiers: NO_QUALIFIERS,
    getSearchText: (runSheet) => runSheet.name,
    totalLabel: (count) => `${count}`,
  });
  return (
    <div className="grid gap-4">
      <TableFilterBar q={view.q} query={view.query} />
      <PersistedDataTable
        tableId="run-sheet-definition.list"
        columns={columns}
        data={view.rows}
        getRowId={(runSheet) => runSheet.id}
        {...(access.canEdit
          ? {
              onRowClick: (runSheet: RunSheetDefinitionDto) =>
                router.push(runSheetEditHref({ id: runSheet.id })),
            }
          : {})}
        rowMenu={(runSheet) => <RunSheetDefinitionRowMenu runSheet={runSheet} access={access} />}
        emptyText={t("empty")}
        pagination={view.pagination}
      />
    </div>
  );
}
