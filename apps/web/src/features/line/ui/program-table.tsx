"use client";

import type { LineDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { ProgramFormData } from "./program-form-data";
import { useProgramColumns } from "./use-program-columns";

export type ProgramTableProps = {
  lines: LineDto[];
  data: ProgramFormData;
  canWrite: boolean;
};

/** The run schedule: what, type, where (item and setup), who is responsible, time and quantity. */
export function ProgramTable({ lines, data, canWrite }: ProgramTableProps) {
  const t = useTranslations("line");
  const columns = useProgramColumns({ data, canWrite });
  return (
    <PersistedDataTable
      tableId="line.list"
      columns={columns}
      data={lines}
      getRowId={(item) => item.id}
      emptyText={t("empty")}
    />
  );
}
