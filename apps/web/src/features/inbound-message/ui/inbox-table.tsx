"use client";

import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { InboxRow } from "./inbox-row";
import { InboxRowActions } from "./inbox-row-actions";
import { useInboxColumns } from "./use-inbox-columns";

export type InboxTableProps = {
  rows: InboxRow[];
  canWrite: boolean;
  canCreateTicket: boolean;
};

/** The inbox: messages of every channel that have no ticket yet (ADR 0085). */
export function InboxTable({ rows, canWrite, canCreateTicket }: InboxTableProps) {
  const t = useTranslations("inbox");
  const columns = useInboxColumns({
    renderActions: (row) => (
      <InboxRowActions row={row} canWrite={canWrite} canCreateTicket={canCreateTicket} />
    ),
  });
  return (
    <PersistedDataTable
      tableId="inbox"
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      emptyText={t("empty")}
    />
  );
}
