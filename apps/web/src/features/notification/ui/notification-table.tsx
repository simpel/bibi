"use client";

import type { NotificationDto } from "@bibi/core/schemas";
import {
  Button,
  cn,
  DataTableRowAction,
  DataTableRowActionGroup,
  type SortingState,
} from "@bibi/ui";
import { MailCheckIcon, MailIcon, RefreshCwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useDataTablePaginationLabels } from "@/lib/use-data-table-pagination-labels";
import { useQueryNavigation } from "@/lib/use-query-navigation";
import { NOTIFICATION_PAGE_SIZES, type NotificationListParams } from "../lib/list-params";
import { useMarkNotifications } from "./use-mark-notifications";
import { useNotificationColumns } from "./use-notification-columns";

import { useNotificationRows } from "./use-notification-rows";

export type NotificationTableProps = {
  notifications: NotificationDto[];
  total: number;
  view: NotificationListParams;
};

/** The URL patch for a new sort: none clears it back to the newest first. */
const sortPatch = ({ sorting }: { sorting: SortingState }) => {
  const [next] = sorting;
  return next ? { sort: next.id, dir: next.desc ? "desc" : "asc" } : { sort: null, dir: null };
};

type Mark = ReturnType<typeof useMarkNotifications>["mark"];
type BulkProps = { rows: NotificationDto[]; mark: Mark };

/** Mark the selected rows read or unread. */
function BulkActions({ rows, mark }: BulkProps) {
  const t = useTranslations("notifications");
  const ids = rows.map((row) => row.id);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => mark({ ids, read: true })}>
        <MailCheckIcon />
        {t("markRead")}
      </Button>
      <Button size="sm" variant="outline" onClick={() => mark({ ids, read: false })}>
        <MailIcon />
        {t("markUnread")}
      </Button>
    </>
  );
}

type RowActionsProps = { notification: NotificationDto; mark: Mark; disabled: boolean };

/** Toggle one row between read and unread. */
function RowActions({ notification, mark, disabled }: RowActionsProps) {
  const t = useTranslations("notifications");
  const read = notification.readAt !== null;
  return (
    <DataTableRowActionGroup>
      <DataTableRowAction
        label={read ? t("markUnread") : t("markRead")}
        icon={read ? MailIcon : MailCheckIcon}
        disabled={disabled}
        onClick={() => mark({ ids: [notification.id], read: !read })}
      />
    </DataTableRowActionGroup>
  );
}

/** Shown when the list changed elsewhere; the rows stay put until the member asks. */
function StaleBar({ onShow, pending }: { onShow: () => void; pending: boolean }) {
  const t = useTranslations("notifications");
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
      <span>{t("listChanged")}</span>
      <Button size="sm" variant="outline" disabled={pending} onClick={onShow}>
        <RefreshCwIcon />
        {t("showLatest")}
      </Button>
    </div>
  );
}

function usePagination({ total, view }: Pick<NotificationTableProps, "total" | "view">) {
  const t = useTranslations("notifications");
  const { navigate } = useQueryNavigation();
  const labels = useDataTablePaginationLabels({ total: (count) => t("listTotal", { count }) });
  return {
    pageIndex: view.page - 1,
    pageSize: view.pageSize,
    pageCount: Math.ceil(total / view.pageSize),
    totalCount: total,
    pageSizeOptions: NOTIFICATION_PAGE_SIZES,
    labels,
    onPaginationChange: ({ pageIndex, pageSize }: { pageIndex: number; pageSize: number }) =>
      navigate({ patch: { page: String(pageIndex + 1), pageSize: String(pageSize) } }),
  };
}

/**
 * The caller's notifications, paged, sorted and filtered on the server (ADR 0094); the URL holds
 * the state. Rows can be marked read or unread one by one or in bulk.
 */
export function NotificationTable({ notifications, total, view }: NotificationTableProps) {
  const t = useTranslations("notifications");
  const { navigate, pending } = useQueryNavigation();
  const rows = useNotificationRows({ notifications, total, params: view });
  const { mark, openOne, pending: marking } = useMarkNotifications();
  const columns = useNotificationColumns({
    onOpen: openOne,
    renderActions: (notification) => (
      <RowActions notification={notification} mark={mark} disabled={marking} />
    ),
  });
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
        emptyText={t("noMatches")}
        pagination={pagination}
        manualSorting
        sorting={[{ id: view.sort, desc: view.direction === "desc" }]}
        onSortingChange={(sorting) => navigate({ patch: sortPatch({ sorting }) })}
        selectable
        bulkActions={(selected) => <BulkActions rows={selected} mark={mark} />}
      />
    </div>
  );
}
