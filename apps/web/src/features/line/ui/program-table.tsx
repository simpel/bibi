"use client";

import type { LineDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { ProgramFormData } from "./program-form-data";
import type { ProgramAccess } from "./program-row-actions";
import { useProgramColumns } from "./use-program-columns";

export type ProgramTableProps = {
  lines: LineDto[];
  data: ProgramFormData;
  access: ProgramAccess;
};

/** The run schedule: what, type, where (item and setup), who is responsible, time and quantity. */
export function ProgramTable({ lines, data, access }: ProgramTableProps) {
  const t = useTranslations("line");
  const columns = useProgramColumns({ data, access });
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
