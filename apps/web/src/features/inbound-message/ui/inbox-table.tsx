"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { inboxMessageRoute } from "@/lib/inbox-routes";
import { useRouter } from "@/lib/navigation";
import { DeleteMessageDialog } from "./delete-message-dialog";
import type { InboxRow } from "./inbox-row";
import { type InboxAbilities, InboxRowActions, InboxRowMenu } from "./inbox-row-actions";
import { useInboxColumns } from "./use-inbox-columns";

export type InboxTableProps = InboxAbilities & {
  /** Persisted column layout: one per table, e.g. `inbox` and `inbox-read`. */
  tableId: string;
  rows: InboxRow[];
};

/**
 * Inbox messages of every channel that have no ticket yet (ADR 0085), with both row menus.
 * Clicking a row opens the message, which marks it read.
 */
export function InboxTable({ tableId, rows, ...abilities }: InboxTableProps) {
  const t = useTranslations("inbox");
  const router = useRouter();
  const [deleting, setDeleting] = useState<InboxRow | null>(null);
  const actions = { ...abilities, onDelete: setDeleting };
  const columns = useInboxColumns({
    renderActions: (row) => <InboxRowActions row={row} {...actions} />,
  });
  return (
    <>
      <PersistedDataTable
        tableId={tableId}
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        onRowClick={(row) => router.push(inboxMessageRoute({ id: row.id }))}
        rowMenu={(row) => <InboxRowMenu row={row} {...actions} />}
        emptyText={t("empty")}
      />
      <DeleteMessageDialog message={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}
