"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { gridRows } from "../permission-grid";
import type { CellChange } from "./permission-cell";
import { usePermissionColumns } from "./use-permission-columns";

export type PermissionGridProps = {
  value: string[];
  /** A save is running: every cell is locked until it is done. */
  pending: boolean;
  /** The `feature:action` cell being saved; it shows a spinner. */
  savingKey: string | null;
  onChange: (cell: CellChange) => void;
};

/** The features × actions matrix as the app's table: one row per feature, one column per action. */
export function PermissionGrid({ value, pending, savingKey, onChange }: PermissionGridProps) {
  const t = useTranslations("permissions");
  const rows = useMemo(() => gridRows(), []);
  const columns = usePermissionColumns({ granted: value, pending, savingKey, onChange });
  return (
    <PersistedDataTable
      tableId="permission-grid"
      columns={columns}
      data={rows}
      getRowId={(row) => row.feature}
      emptyText={t("empty")}
    />
  );
}
