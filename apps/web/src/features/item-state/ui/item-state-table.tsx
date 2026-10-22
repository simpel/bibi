"use client";

import type { ItemStateDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RowAccess } from "@/lib/can";
import { toStateRows } from "./state-rows";
import { useStateColumns } from "./use-state-columns";

export type ItemStateTableProps = { states: ItemStateDto[]; access: RowAccess };

/** One item type's states in order. */
export function ItemStateTable({ states, access }: ItemStateTableProps) {
  const t = useTranslations("itemState");
  const columns = useStateColumns({ states, access });
  const rows = useMemo(() => toStateRows({ states }), [states]);
  return (
    <PersistedDataTable
      tableId="item-state.list"
      columns={columns}
      data={rows}
      getRowId={(row) => row.state.id}
      emptyText={t("empty")}
    />
  );
}
