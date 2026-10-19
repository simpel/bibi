"use client";

import type { SetupDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RowAccess } from "@/lib/can";
import { useSetupColumns } from "./use-setup-columns";

export type SetupTableProps = { setups: SetupDto[]; access: RowAccess };

/** Setups of the organization with their changeover time. */
export function SetupTable({ setups, access }: SetupTableProps) {
  const t = useTranslations("setup");
  const columns = useSetupColumns({ access });
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
