"use client";

import type { ProgramItemDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { ProgramFormData } from "./program-form-data";
import type { ProgramAccess } from "./program-row-actions";
import { useProgramColumns } from "./use-program-columns";

export type ProgramTableProps = {
  programItems: ProgramItemDto[];
  data: ProgramFormData;
  access: ProgramAccess;
};

/** The run schedule: what, type, where (item and setup), who is responsible, time and quantity. */
export function ProgramTable({ programItems, data, access }: ProgramTableProps) {
  const t = useTranslations("programItem");
  const columns = useProgramColumns({ data, access });
  return (
    <PersistedDataTable
      tableId="program-item.list"
      columns={columns}
      data={programItems}
      getRowId={(item) => item.id}
      emptyText={t("empty")}
    />
  );
}
