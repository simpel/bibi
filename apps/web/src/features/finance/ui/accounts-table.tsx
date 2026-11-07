"use client";

import type { AccountingSettingsDto } from "@bibi/core/schemas";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { AccountRow } from "../lib/account-rows";
import type { ItemTypeOption } from "../lib/accounting-form";
import { AccountRowActions } from "./account-row-actions";
import { useAccountColumns } from "./use-account-columns";

export type AccountsTableProps = {
  /** Stable id of the table, e.g. `finance.accounts`. */
  tableId: string;
  rows: AccountRow[];
  settings: AccountingSettingsDto;
  types: ItemTypeOption[];
  grouped: boolean;
  emptyText: string;
  /** Inside a card: the table runs edge to edge (ADR 0086). */
  flush?: boolean;
  /** Without `finance:write` there is no actions column. */
  canEdit: boolean;
};

/** A list of accounts with an edit action per row. */
export function AccountsTable({
  tableId,
  rows,
  settings,
  types,
  grouped,
  emptyText,
  canEdit,
  flush = false,
}: AccountsTableProps) {
  const columns = useAccountColumns({
    types,
    grouped,
    ...(canEdit
      ? {
          renderActions: (row) => <AccountRowActions row={row} settings={settings} types={types} />,
        }
      : {}),
  });
  return (
    <PersistedDataTable
      tableId={tableId}
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      emptyText={emptyText}
      flush={flush}
    />
  );
}
