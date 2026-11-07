"use client";

import type { SetupDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import type { RowAccess } from "@/lib/can";
import { useSetupColumns } from "./use-setup-columns";

export type SetupTableProps = { setups: SetupDto[]; access: RowAccess };

/** Setups of the organization with their changeover time. */
export function SetupTable({ setups, access }: SetupTableProps) {
  const t = useTranslations("setup");
  const columns = useSetupColumns({ access });
  const view = useClientTableView({
    rows: setups,
    qualifiers: [],
    getSearchText: (setup) => setup.name,
    totalLabel: (count) => `${count}`,
  });
  return (
    <div className="grid gap-4">
      <TableFilterBar q={view.q} query={view.query} />
      <PersistedDataTable
        tableId="setup.list"
        columns={columns}
        data={view.rows}
        getRowId={(setup) => setup.id}
        emptyText={t("empty")}
        pagination={view.pagination}
      />
    </div>
  );
}
