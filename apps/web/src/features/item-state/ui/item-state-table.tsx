"use client";

import type { ItemStateDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RowAccess } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
import { ItemStateRowMenu, itemStateEditHref } from "./item-state-row-actions";
import { toStateRows } from "./state-rows";
import { useStateColumns } from "./use-state-columns";

export type ItemStateTableProps = { states: ItemStateDto[]; access: RowAccess };

/** One item type's states in order (a handful, so no search or paging). */
export function ItemStateTable({ states, access }: ItemStateTableProps) {
  const t = useTranslations("itemState");
  const router = useRouter();
  const columns = useStateColumns({ states, access });
  const rows = useMemo(() => toStateRows({ states }), [states]);
  return (
    <PersistedDataTable
      tableId="item-state.list"
      flush
      columns={columns}
      data={rows}
      getRowId={(row) => row.state.id}
      {...(access.canEdit
        ? {
            onRowClick: (row: (typeof rows)[number]) =>
              router.push(itemStateEditHref({ id: row.state.id })),
          }
        : {})}
      rowMenu={(row) => <ItemStateRowMenu state={row.state} access={access} />}
      emptyText={t("empty")}
    />
  );
}
