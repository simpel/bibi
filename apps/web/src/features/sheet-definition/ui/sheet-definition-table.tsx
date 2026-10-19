"use client";

import type { SheetDefinitionDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RowAccess } from "@/lib/can";
import type { SheetOptions } from "./sheet-options";
import { useSheetDefinitionColumns } from "./use-sheet-definition-columns";

export type SheetDefinitionTableProps = {
  sheets: SheetDefinitionDto[];
  options: SheetOptions;
  access: RowAccess;
};

/** The organization's sheets: what each includes and which role it goes to. */
export function SheetDefinitionTable({ sheets, options, access }: SheetDefinitionTableProps) {
  const t = useTranslations("sheetDefinition");
  const columns = useSheetDefinitionColumns({ options, access });
  return (
    <PersistedDataTable
      tableId="sheet-definition.list"
      columns={columns}
      data={sheets}
      getRowId={(sheet) => sheet.id}
      emptyText={t("empty")}
    />
  );
}
