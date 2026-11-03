import type { NotificationDto } from "@bibi/core/schemas";
import type { SortingState } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useDataTablePaginationLabels } from "@/lib/use-data-table-pagination-labels";
import { useQueryNavigation } from "@/lib/use-query-navigation";
import { NOTIFICATION_PAGE_SIZES, type NotificationListParams } from "../lib/list-params";
import { useMarkNotifications } from "./use-mark-notifications";
import { useNotificationColumns } from "./use-notification-columns";
import { useNotificationSheet } from "./use-notification-sheet";

/** The URL patch for a new sort: none clears it back to the newest first. */
export const sortPatch = ({ sorting }: { sorting: SortingState }) => {
  const [next] = sorting;
  return next ? { sort: next.id, dir: next.desc ? "desc" : "asc" } : { sort: null, dir: null };
};

export function usePagination({ total, view }: { total: number; view: NotificationListParams }) {
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

/** The caller's marks, applied in place, the sheet built on them, and the columns. */
export function useTableParts() {
  const marks = useMarkNotifications();
  const sheet = useNotificationSheet({ mark: marks.mark });
  const [deleting, setDeleting] = useState<string[] | null>(null);
  const row = {
    onSelect: sheet.select,
    onToggleRead: ({ notification }: { notification: NotificationDto }) =>
      marks.mark({ ids: [notification.id], read: notification.readAt === null }),
    onDelete: ({ notification }: { notification: NotificationDto }) =>
      setDeleting([notification.id]),
  };
  const columns = useNotificationColumns({ ...row, openingId: sheet.openingId });
  const sheetProps = {
    notification: sheet.selected,
    onClose: sheet.close,
    onMarkUnread: sheet.markUnread,
    onDelete: ({ notification }: { notification: NotificationDto }) => {
      sheet.close();
      setDeleting([notification.id]);
    },
  };
  return { ...marks, sheet, sheetProps, columns, row, deleting, setDeleting };
}
