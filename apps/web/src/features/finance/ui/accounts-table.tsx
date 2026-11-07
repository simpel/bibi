"use client";

import type { AccountingSettingsDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { type QuickFilterPill, TableFilterBar } from "@/components/data-table/table-filter-bar";
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
  grouped: boolean;
  emptyText: string;
  /** Inside a card: the table runs edge to edge (ADR 0086). */
  flush?: boolean;
  /** Without `finance:write` there is no actions column. */
  canEdit: boolean;
  /** A second table on the page keeps its own search and page in the URL. */
  scope?: string;
};

type QualifiersInput = { rows: AccountRow[]; labels: AccountLabels; grouped: boolean };

function useAccountQualifiers({ rows, labels, grouped }: QualifiersInput) {
  const t = useTranslations("finance.accounting");
  return useMemo<TableQualifier<AccountRow>[]>(() => {
    const groups = Array.from(new Set(rows.flatMap((row) => labels.group(row) ?? [])));
    return [
      {
        key: "name",
        label: t("columns.name"),
        hint: t("columns.name"),
        pick: labels.name,
        options: rows.map(labels.name),
      },
      ...(grouped
        ? [
            {
              key: "group",
              label: t("columns.group"),
              hint: groups.join(", "),
              pick: labels.group,
              options: groups,
            },
          ]
        : []),
      {
        key: "account",
        label: t("columns.account"),
        hint: t("columns.account"),
        pick: (row: AccountRow) => row.value,
        options: rows.map((row) => row.value),
      },
    ];
  }, [t, rows, labels, grouped]);
}

/** A list of accounts with search, filters and an edit action per row. */
export function AccountsTable({
  tableId,
  rows,
  settings,
  types,
  grouped,
  emptyText,
  canEdit,
  scope,
  flush = false,
}: AccountsTableProps) {
  const t = useTranslations("finance.accounting");
  const common = useTranslations("common");
  const [editing, setEditing] = useState<AccountRow | null>(null);
  const labels = useAccountLabels({ types });
  const qualifiers = useAccountQualifiers({ rows, labels, grouped });
  const view = useClientTableView({
    rows,
    qualifiers,
    getSearchText: (row) => `${labels.name(row)} ${labels.group(row) ?? ""} ${row.value}`,
    totalLabel: (count) => `${count}`,
    ...(scope ? { scope } : {}),
  });
  const groups = grouped ? (["accounts", "vat"] as const) : [];
  const pills: QuickFilterPill[] = groups.length
    ? [
        { key: "all", label: common("readFilter.all"), query: undefined },
        ...groups.map((group) => {
          const label = t(`groups.${group}`);
          return {
            key: group,
            label,
            query: `group:${label.includes(" ") ? `"${label}"` : label}`,
          };
        }),
      ]
    : [];
  const columns = useAccountColumns({
    labels,
    grouped,
    ...(canEdit
      ? { renderActions: (row) => <AccountRowActions row={row} onEdit={setEditing} /> }
      : {}),
  });
  return (
    <div className="grid gap-4">
      <div className={flush ? "px-6" : undefined}>
        <TableFilterBar
          q={view.q}
          query={view.query}
          keys={view.keys}
          pills={pills.length ? pills : undefined}
          onSelectPill={(next) => view.navigate({ patch: { q: next ?? null, page: null } })}
        />
      </div>
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
        flush={flush}
      />
      {editing ? (
        <AccountDialog
          open
          onOpenChange={(open) => !open && setEditing(null)}
          settings={settings}
          types={types}
          target={editing.target}
        />
      ) : null}
    </div>
  );
}
