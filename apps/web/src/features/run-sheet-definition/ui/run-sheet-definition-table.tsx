"use client";

import type { RunSheetDefinitionDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import type { RowAccess } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
import { RunSheetDefinitionRowMenu, runSheetEditHref } from "./run-sheet-definition-row-actions";
import { namesOf, type RunSheetOption, type RunSheetOptions } from "./run-sheet-options";
import { useRunSheetDefinitionColumns } from "./use-run-sheet-definition-columns";

export type RunSheetDefinitionTableProps = {
  runSheets: RunSheetDefinitionDto[];
  options: RunSheetOptions;
  access: RowAccess;
};

function useRunSheetQualifiers({ options }: { options: RunSheetOptions }) {
  const t = useTranslations("runSheetDefinition.columns");
  return useMemo<TableQualifier<RunSheetDefinitionDto>[]>(() => {
    const pickNames = ({
      ids,
      list,
    }: {
      ids: readonly string[];
      list: readonly RunSheetOption[];
    }) => namesOf({ ids, options: list });
    return [
      {
        key: "responsibility",
        label: t("responsibility"),
        hint: options.responsibilities.map((item) => item.name).join(", "),
        pick: (runSheet) =>
          pickNames({ ids: [runSheet.responsibilityId], list: options.responsibilities }),
        options: options.responsibilities.map((item) => item.name),
      },
      {
        key: "type",
        label: t("types"),
        hint: options.types.map((item) => item.name).join(", "),
        pick: (runSheet) => pickNames({ ids: runSheet.entityTypeIds, list: options.types }),
        options: options.types.map((item) => item.name),
      },
      {
        key: "list",
        label: t("lists"),
        hint: options.lists.map((item) => item.name).join(", "),
        pick: (runSheet) => pickNames({ ids: runSheet.vocabularyIds, list: options.lists }),
        options: options.lists.map((item) => item.name),
      },
    ];
  }, [t, options]);
}

/** The organization's run sheets: what each includes and which role it goes to. */
export function RunSheetDefinitionTable({
  runSheets,
  options,
  access,
}: RunSheetDefinitionTableProps) {
  const t = useTranslations("runSheetDefinition");
  const router = useRouter();
  const columns = useRunSheetDefinitionColumns({ options, access });
  const qualifiers = useRunSheetQualifiers({ options });
  const view = useClientTableView({
    rows: runSheets,
    qualifiers,
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
