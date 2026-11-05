"use client";

import { INBOUND_CHANNELS } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { type QuickFilterPill, TableFilterBar } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import { DeleteMessageDialog } from "./delete-message-dialog";
import { InboxBulkActions } from "./inbox-bulk-actions";
import type { InboxRow } from "./inbox-row";
import { type InboxAbilities, InboxRowActions, InboxRowMenu } from "./inbox-row-actions";
import { MessageSheet } from "./message-sheet";
import { useInboxColumns } from "./use-inbox-columns";
import { useInboxTable } from "./use-inbox-table";

export type InboxTableProps = InboxAbilities & { rows: InboxRow[] };

function useInboxQualifiers({ rows }: { rows: InboxRow[] }): TableQualifier<InboxRow>[] {
  const t = useTranslations("inbox");
  const common = useTranslations("common");
  const unreadLabel = common("readFilter.unread");
  const readLabel = common("readFilter.read");
  return useMemo(
    () => [
      {
        key: "status",
        label: common("status"),
        hint: `${unreadLabel}, ${readLabel}`,
        pick: (row) => (row.read ? readLabel : unreadLabel),
        options: [unreadLabel, readLabel],
      },
      {
        key: "channel",
        label: t("columns.channel"),
        hint: INBOUND_CHANNELS.map((c) => t(`channels.${c}`)).join(", "),
        pick: (row) => t(`channels.${row.channel}`),
        options: INBOUND_CHANNELS.map((c) => t(`channels.${c}`)),
      },
      {
        key: "sender",
        label: t("columns.sender"),
        hint: t("columns.sender"),
        pick: (row) => row.sender ?? t("unknownSender"),
        options: rows.map((row) => row.sender ?? t("unknownSender")),
      },
    ],
    [t, common, unreadLabel, readLabel, rows],
  );
}

function useInboxView({ rows }: { rows: InboxRow[] }) {
  const t = useTranslations("inbox");
  const common = useTranslations("common");
  const qualifiers = useInboxQualifiers({ rows });
  const view = useClientTableView({
    rows,
    qualifiers,
    getSearchText: (row) =>
      `${row.subject ?? ""} ${row.sender ?? ""} ${t(`channels.${row.channel}`)}`,
    totalLabel: (count) => `${count}`,
  });
  const pills: QuickFilterPill[] = [
    { key: "all", label: common("readFilter.all"), query: undefined },
    {
      key: "unread",
      label: common("readFilter.unread"),
      query: `status:${common("readFilter.unread")}`,
    },
    { key: "read", label: common("readFilter.read"), query: `status:${common("readFilter.read")}` },
  ];
  return { view, pills };
}

/**
 * Inbox messages of every channel that have no order yet (ADR 0085), with unified `QuerySearch`
 * qualifier filtering, `DataTablePagination`, `DataTableRowActions`, `rowMenu` and bulk actions.
 */
export function InboxTable({ rows, ...abilities }: InboxTableProps) {
  const t = useTranslations("inbox");
  const { view, pills } = useInboxView({ rows });
  const { sheet, handlers, bulk, deleting, closeDelete } = useInboxTable(abilities);
  const columns = useInboxColumns({
    ...handlers,
    openingId: sheet.openingId,
    renderActions: (row) => (
      <InboxRowActions row={row} {...handlers} canCreateOrder={abilities.canCreateOrder} />
    ),
  });
  return (
    <div className="grid gap-4">
      <TableFilterBar
        q={view.q}
        query={view.query}
        placeholder={t("search")}
        pills={pills}
        onSelectPill={(next) => view.navigate({ patch: { q: next ?? null, page: null } })}
      />
      <PersistedDataTable
        tableId="inbox"
        columns={columns}
        data={view.rows}
        getRowId={(row) => row.id}
        onRowClick={(row) => void sheet.select({ row })}
        rowClassName={(row) => (row.read ? "bg-muted/40" : "bg-card")}
        rowMenu={(row) => (
          <InboxRowMenu row={row} {...handlers} canCreateOrder={abilities.canCreateOrder} />
        )}
        emptyText={t("empty")}
        selectable
        bulkActions={(selected) => <InboxBulkActions rows={selected} {...bulk} />}
        pagination={view.pagination}
      />
      <MessageSheet
        row={sheet.selected}
        onClose={sheet.close}
        onMarkUnread={sheet.markUnread}
        onDelete={sheet.remove}
        {...abilities}
      />
      <DeleteMessageDialog messages={deleting} onClose={closeDelete} />
    </div>
  );
}
