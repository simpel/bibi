"use client";

import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { DeleteMessageDialog } from "./delete-message-dialog";
import { InboxBulkActions } from "./inbox-bulk-actions";
import type { InboxRow } from "./inbox-row";
import { type InboxAbilities, InboxRowMenu } from "./inbox-row-actions";
import { MessageSheet } from "./message-sheet";
import { useInboxColumns } from "./use-inbox-columns";
import { useInboxTable } from "./use-inbox-table";

export type InboxTableProps = InboxAbilities & { rows: InboxRow[] };

/**
 * Inbox messages of every channel that have no ticket yet (ADR 0085), in the same table as the
 * notifications: read and unread together, icons for read state and delete, the right-click
 * menu, and bulk actions. A row opens its sheet, marking it read with the row pending meanwhile.
 */
export function InboxTable({ rows, ...abilities }: InboxTableProps) {
  const t = useTranslations("inbox");
  const { sheet, handlers, bulk, deleting, closeDelete } = useInboxTable(abilities);
  const columns = useInboxColumns({ ...handlers, openingId: sheet.openingId });
  return (
    <>
      <PersistedDataTable
        tableId="inbox"
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        onRowClick={(row) => void sheet.select({ row })}
        rowClassName={(row) => (row.read ? "bg-muted/40" : "bg-card")}
        rowMenu={(row) => (
          <InboxRowMenu row={row} {...handlers} canCreateTicket={abilities.canCreateTicket} />
        )}
        emptyText={t("empty")}
        selectable
        bulkActions={(selected) => <InboxBulkActions rows={selected} {...bulk} />}
      />
      <MessageSheet
        row={sheet.selected}
        onClose={sheet.close}
        onMarkUnread={sheet.markUnread}
        onDelete={sheet.remove}
        {...abilities}
      />
      <DeleteMessageDialog messages={deleting} onClose={closeDelete} />
    </>
  );
}
