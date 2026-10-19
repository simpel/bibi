"use client";

import type { ResponsibilityDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RowAccess } from "@/lib/can";
import type { ResponsibilityOptions } from "./responsibility-options";
import { useResponsibilityColumns } from "./use-responsibility-columns";

export type ResponsibilityTableProps = {
  responsibilities: ResponsibilityDto[];
  options: ResponsibilityOptions;
  access: RowAccess;
};

/** The organization's responsibilities: what each covers and who answers for it by default. */
export function ResponsibilityTable({
  responsibilities,
  options,
  access,
}: ResponsibilityTableProps) {
  const t = useTranslations("responsibility");
  const columns = useResponsibilityColumns({ options, access });
  return (
    <PersistedDataTable
      tableId="responsibility.list"
      columns={columns}
      data={responsibilities}
      getRowId={(responsibility) => responsibility.id}
      emptyText={t("empty")}
    />
  );
}
