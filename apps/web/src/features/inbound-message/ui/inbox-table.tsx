"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { DeleteMessageDialog } from "./delete-message-dialog";
import type { InboxRow } from "./inbox-row";
import { type InboxAbilities, InboxRowActions, InboxRowMenu } from "./inbox-row-actions";
import { MessageSheet } from "./message-sheet";
import { useInboxColumns } from "./use-inbox-columns";
import { useMessageSheet } from "./use-message-sheet";

export type InboxTableProps = InboxAbilities & {
  /** Persisted column layout: one per table, e.g. `inbox` and `inbox-read`. */
  tableId: string;
  rows: InboxRow[];
};

/**
 * Inbox messages of every channel that have no ticket yet (ADR 0085), with both row menus.
 * Clicking a row or its subject opens the message in a sheet, which marks it read.
 */
export function InboxTable({ tableId, rows, ...abilities }: InboxTableProps) {
  const t = useTranslations("inbox");
  const [deleting, setDeleting] = useState<InboxRow | null>(null);
  const sheet = useMessageSheet({ onDelete: setDeleting });
  const actions = { ...abilities, onDelete: setDeleting };
  const columns = useInboxColumns({
    renderActions: (row) => <InboxRowActions row={row} {...actions} />,
    onSelect: sheet.select,
  });
  return (
    <>
      <PersistedDataTable
        tableId={tableId}
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        onRowClick={(row) => sheet.select({ row })}
        rowMenu={(row) => <InboxRowMenu row={row} {...actions} />}
        emptyText={t("empty")}
      />
      <MessageSheet
        row={sheet.selected}
        onClose={sheet.close}
        onMarkUnread={sheet.markUnread}
        onDelete={sheet.remove}
        {...abilities}
      />
      <DeleteMessageDialog message={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}
