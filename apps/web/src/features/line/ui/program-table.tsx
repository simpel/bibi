"use client";

import type { LineAmounts, LineDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { ProgramFormData } from "./program-form-data";
import type { ProgramAccess } from "./program-row-actions";
import { useProgramColumns } from "./use-program-columns";

export type ProgramTableProps = {
  lines: LineDto[];
  data: ProgramFormData;
  access: ProgramAccess;
  /** The lines' amounts and the ticket's total (`line.amounts`); null when it failed to load. */
  amounts: LineAmounts | null;
};

/**
 * The run schedule: what, type, where (item and setup), state, time, quantity, unit price and
 * amount, with the ticket's total in the footer.
 */
export function ProgramTable({ lines, data, access, amounts }: ProgramTableProps) {
  const t = useTranslations("line");
  const columns = useProgramColumns({ lines, data, access, amounts });
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
