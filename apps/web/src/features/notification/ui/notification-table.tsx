"use client";

import type { NotificationDto } from "@bibi/core/schemas";
import { cn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useQueryNavigation } from "@/lib/use-query-navigation";
import type { NotificationListParams } from "../lib/list-params";
import { DeleteNotificationsDialog } from "./delete-notifications-dialog";
import { NotificationRowMenu } from "./notification-row-menu";
import { NotificationSheet } from "./notification-sheet";
import { BulkActions, StaleBar } from "./notification-table-bars";
import { useNotificationRows } from "./use-notification-rows";
import { sortPatch, usePagination, useTableParts } from "./use-notification-table";

export type NotificationTableProps = {
  notifications: NotificationDto[];
  total: number;
  view: NotificationListParams;
};

/**
 * The caller's notifications, paged, sorted and filtered on the server (ADR 0094); the URL holds
 * the state. A row opens its sheet (marking it read, the row pending meanwhile); marks from the
 * hover action, the right-click menu, the sheet or the bulk bar apply in place, so nothing moves.
 */
export function NotificationTable({ notifications, total, view }: NotificationTableProps) {
  const t = useTranslations("notifications");
  const { navigate, pending } = useQueryNavigation();
  const rows = useNotificationRows({ notifications, total, params: view });
  const parts = useTableParts();
  const { mark, pending: marking, sheet, columns, row, deleting, setDeleting } = parts;
  const pagination = usePagination({ total: rows.total, view });
  return (
    <div className="grid gap-3">
      {rows.stale ? <StaleBar onShow={rows.reload} pending={rows.reloading} /> : null}
      <PersistedDataTable
        tableId="notification.list"
        className={cn((pending || rows.reloading) && "opacity-60 transition-opacity")}
        columns={columns}
        data={rows.rows}
        getRowId={(notification) => notification.id}
        rowClassName={(notification) => (notification.readAt === null ? "bg-card" : "bg-muted/40")}
        onRowClick={(notification) => void sheet.select({ notification })}
        rowMenu={(notification) => (
          <NotificationRowMenu notification={notification} {...row} disabled={marking} />
        )}
        emptyText={t("noMatches")}
        pagination={pagination}
        manualSorting
        sorting={[{ id: view.sort, desc: view.direction === "desc" }]}
        onSortingChange={(sorting) => navigate({ patch: sortPatch({ sorting }) })}
        selectable
        bulkActions={(selected) => (
          <BulkActions rows={selected} mark={mark} onDelete={setDeleting} />
        )}
      />
      <NotificationSheet {...parts.sheetProps} />
      <DeleteNotificationsDialog ids={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}
