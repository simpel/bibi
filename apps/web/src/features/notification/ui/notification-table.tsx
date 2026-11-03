"use client";

import type { NotificationDto } from "@bibi/core/schemas";
import {
  Button,
  cn,
  DataTableRowAction,
  DataTableRowActionGroup,
  type SortingState,
} from "@bibi/ui";
import { MailCheckIcon, MailIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useDataTablePaginationLabels } from "@/lib/use-data-table-pagination-labels";
import { useQueryNavigation } from "@/lib/use-query-navigation";
import { NOTIFICATION_PAGE_SIZES, type NotificationListParams } from "../lib/list-params";
import { useMarkNotifications } from "./use-mark-notifications";
import { useNotificationColumns } from "./use-notification-columns";

export type NotificationTablePage = Pick<
  NotificationListParams,
  "page" | "pageSize" | "sort" | "direction"
>;

export type NotificationTableProps = {
  notifications: NotificationDto[];
  total: number;
  view: NotificationTablePage;
};

/** The URL patch for a new sort: none clears it back to the newest first. */
const sortPatch = ({ sorting }: { sorting: SortingState }) => {
  const [next] = sorting;
  return next ? { sort: next.id, dir: next.desc ? "desc" : "asc" } : { sort: null, dir: null };
};

type BulkProps = { rows: NotificationDto[]; mark: ReturnType<typeof useMarkNotifications>["mark"] };

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
  const { mark, openOne, pending: marking } = useMarkNotifications();
  const columns = useNotificationColumns({
    onOpen: openOne,
    renderActions: (notification) => {
      const read = notification.readAt !== null;
      return (
        <DataTableRowActionGroup>
          <DataTableRowAction
            label={read ? t("markUnread") : t("markRead")}
            icon={read ? MailIcon : MailCheckIcon}
            disabled={marking}
            onClick={() => mark({ ids: [notification.id], read: !read })}
          />
        </DataTableRowActionGroup>
      );
    },
  });
  return (
    <PersistedDataTable
      tableId="notification.list"
      className={cn(pending && "opacity-60 transition-opacity")}
      columns={columns}
      data={notifications}
      getRowId={(notification) => notification.id}
      emptyText={t("noMatches")}
      pagination={usePagination({ total, view })}
      manualSorting
      sorting={[{ id: view.sort, desc: view.direction === "desc" }]}
      onSortingChange={(sorting) => navigate({ patch: sortPatch({ sorting }) })}
      selectable
      bulkActions={(rows) => <BulkActions rows={rows} mark={mark} />}
    />
  );
}
