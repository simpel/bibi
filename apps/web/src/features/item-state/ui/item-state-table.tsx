"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { qualifierPills } from "@/components/data-table/qualifier-pills";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import type { RowAccess } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
import type { TypeStates } from "../load-item-state-data";
import { ItemStateRowMenu, itemStateEditHref } from "./item-state-row-actions";
import { type TypedStateRow, toTypedStateRows } from "./state-rows";
import { useStateColumns } from "./use-state-columns";
import { useStateQualifiers } from "./use-state-qualifiers";

export type ItemStateTableProps = { entries: TypeStates[]; access: RowAccess };

/** The states of every item type in one table, each type's states in its own order. */
export function ItemStateTable({ entries, access }: ItemStateTableProps) {
  const t = useTranslations("itemState");
  const common = useTranslations("common");
  const router = useRouter();
  const columns = useStateColumns({ access });
  const rows = useMemo(() => toTypedStateRows({ entries }), [entries]);
  const typeNames = useMemo(() => entries.map((entry) => entry.type.name), [entries]);
  const qualifiers = useStateQualifiers({ typeNames });
  const view = useClientTableView({
    rows,
    qualifiers,
    getSearchText: (row) => `${row.state.name} ${row.typeName}`,
    totalLabel: (count) => `${count}`,
  });
  const pills = qualifierPills({
    allLabel: common("readFilter.all"),
    qualifier: "type",
    values: entries.map((entry) => ({ key: entry.type.id, label: entry.type.name })),
  });
  return (
    <div className="grid gap-4">
      <TableFilterBar
        q={view.q}
        query={view.query}
        pills={pills}
        onSelectPill={(next) => view.navigate({ patch: { q: next ?? null, page: null } })}
      />
      <PersistedDataTable
        tableId="item-state.list"
        columns={columns}
        data={view.rows}
        getRowId={(row: TypedStateRow) => row.state.id}
        {...(access.canEdit
          ? {
              onRowClick: (row: TypedStateRow) =>
                router.push(itemStateEditHref({ id: row.state.id })),
            }
          : {})}
        rowMenu={(row) => <ItemStateRowMenu state={row.state} access={access} />}
        emptyText={t("empty")}
        pagination={view.pagination}
      />
    </div>
  );
}
