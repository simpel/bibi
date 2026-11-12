"use client";

import type { AccountingSettingsDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import type { AccountRow } from "../lib/account-rows";
import type { ItemTypeOption } from "../lib/accounting-form";
import { AccountDialog } from "./account-dialog";
import { AccountRowActions, AccountRowMenu } from "./account-row-actions";
import { useAccountColumns } from "./use-account-columns";
import { type AccountLabels, useAccountLabels } from "./use-account-labels";

export type AccountsTableProps = {
  /** Stable id of the table, e.g. `finance.accounts`. */
  tableId: string;
  rows: AccountRow[];
  settings: AccountingSettingsDto;
  types: ItemTypeOption[];
  emptyText: string;
  /** Without `finance:write` there is no actions column. */
  canEdit: boolean;
  /** A second table on the page keeps its own search and page in the URL. */
  scope?: string;
  /** After a save; without it the page refreshes. The assistant's card keeps the new value. */
  onSaved?: (input: { value: AccountingSettingsDto }) => void;
};

type QualifiersInput = { rows: AccountRow[]; labels: AccountLabels };

function useAccountQualifiers({ rows, labels }: QualifiersInput) {
  const t = useTranslations("finance.accounting");
  return useMemo<TableQualifier<AccountRow>[]>(() => {
    return [
      {
        key: "name",
        label: t("columns.name"),
        hint: t("columns.name"),
        pick: labels.name,
        options: rows.map(labels.name),
      },
      {
        key: "account",
        label: t("columns.account"),
        hint: t("columns.account"),
        pick: (row: AccountRow) => row.value,
        options: rows.map((row) => row.value),
      },
    ];
  }, [t, rows, labels]);
}

/** A list of accounts with search, filters and an edit action per row. */
export function AccountsTable({
  tableId,
  rows,
  settings,
  types,
  emptyText,
  canEdit,
  scope,
  onSaved,
}: AccountsTableProps) {
  const [editing, setEditing] = useState<AccountRow | null>(null);
  const labels = useAccountLabels({ types });
  const qualifiers = useAccountQualifiers({ rows, labels });
  const view = useClientTableView({
    rows,
    qualifiers,
    getSearchText: (row) => `${labels.name(row)} ${row.value}`,
    totalLabel: (count) => `${count}`,
    ...(scope ? { scope } : {}),
  });
  const columns = useAccountColumns({
    labels,
    ...(canEdit
      ? { renderActions: (row) => <AccountRowActions row={row} onEdit={setEditing} /> }
      : {}),
  });
  return (
    <div className="grid gap-4">
      <TableFilterBar q={view.q} query={view.query} keys={view.keys} />
      <PersistedDataTable
        tableId={tableId}
        columns={columns}
        data={view.rows}
        getRowId={(row) => row.id}
        {...(canEdit
          ? {
              onRowClick: setEditing,
              rowMenu: (row: AccountRow) => <AccountRowMenu row={row} onEdit={setEditing} />,
            }
          : {})}
        emptyText={emptyText}
        pagination={view.pagination}
      />
      {editing ? (
        <AccountDialog
          open
          onOpenChange={(open) => !open && setEditing(null)}
          settings={settings}
          types={types}
          target={editing.target}
          onSaved={onSaved}
        />
      ) : null}
    </div>
  );
}
