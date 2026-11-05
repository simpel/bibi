"use client";

import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RunSheetNeedRow, RunSheetTaskRow } from "../document-rows";
import { useRunSheetNeedColumns } from "./use-run-sheet-need-columns";
import { type RunSheetFieldColumn, useRunSheetTaskColumns } from "./use-run-sheet-task-columns";

export type RunSheetTaskTableProps = {
  tasks: RunSheetTaskRow[];
  fields: readonly RunSheetFieldColumn[];
};

/** What to deliver: one row per line on the run sheet, in time order. */
export function RunSheetTaskTable({ tasks, fields }: RunSheetTaskTableProps) {
  const t = useTranslations("runSheet.document");
  const columns = useRunSheetTaskColumns({ fields });
  return (
    <PersistedDataTable
      tableId="run-sheet.tasks"
      columns={columns}
      data={tasks}
      getRowId={(row) => row.key}
      emptyText={t("noTasks")}
    />
  );
}

export type RunSheetNeedTableProps = { needs: RunSheetNeedRow[] };

/** The counted needs the run sheet includes, e.g. allergens. */
export function RunSheetNeedTable({ needs }: RunSheetNeedTableProps) {
  const t = useTranslations("runSheet.document");
  const columns = useRunSheetNeedColumns();
  return (
    <PersistedDataTable
      tableId="run-sheet.needs"
      columns={columns}
      data={needs}
      getRowId={(row) => row.key}
      emptyText={t("noNeeds")}
    />
  );
}
