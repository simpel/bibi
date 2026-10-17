"use client";

import type { SetupDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useSetupColumns } from "./use-setup-columns";

export type SetupTableProps = { setups: SetupDto[]; canWrite: boolean };

/** Setups of the organization with their changeover time. */
export function SetupTable({ setups, canWrite }: SetupTableProps) {
  const t = useTranslations("setup");
  const columns = useSetupColumns({ canWrite });
  return (
    <PersistedDataTable
      tableId="setup.list"
      columns={columns}
      data={setups}
      getRowId={(setup) => setup.id}
      emptyText={t("empty")}
    />
  );
}
