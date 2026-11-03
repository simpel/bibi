"use client";

import type { NotificationDto } from "@bibi/core/schemas";
import { Button, cn, type SortingState } from "@bibi/ui";
import { MailCheckIcon, MailIcon, RefreshCwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useRouter } from "@/lib/navigation";
import { useDataTablePaginationLabels } from "@/lib/use-data-table-pagination-labels";
import { useQueryNavigation } from "@/lib/use-query-navigation";
import {
  NOTIFICATION_PAGE_PARAMS,
  NOTIFICATION_PAGE_SIZES,
  type NotificationListParams,
} from "../lib/list-params";
import { NotificationRowMenu } from "./notification-row-menu";
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
type BulkProps = { rows: NotificationDto[]; mark: Mark; read: boolean };

/** The selected rows to the other table: unread ones marked read, read ones unread. */
function BulkAction({ rows, mark, read }: BulkProps) {
  const t = useTranslations("notifications");
  const ids = rows.map((row) => row.id);
  return (
    <Button size="sm" variant="outline" onClick={() => mark({ ids, read: !read })}>
      {read ? <MailIcon /> : <MailCheckIcon />}
      {read ? t("markUnread") : t("markRead")}
    </Button>
  );
}

type EmptyTextInput = {
  t: ReturnType<typeof useTranslations<"notifications">>;
  view: NotificationListParams;
};

/** Nothing here: no unread (or read) ones, or none that match the search and kind. */
const emptyText = ({ t, view }: EmptyTextInput) => {
  if (view.q || view.kind) return t("noMatches");
  return view.read === "unread" ? t("noUnread") : t("noRead");
};

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
    onPaginationChange: ({ pageIndex, pageSize }: { pageIndex: number; pageSize: number }) => {
      const names = NOTIFICATION_PAGE_PARAMS[view.read];
      navigate({
        patch: { [names.page]: String(pageIndex + 1), [names.pageSize]: String(pageSize) },
      });
    },
  };
}

/**
 * One of the page's two tables, unread or read: paged, sorted and filtered on the server (ADR
 * 0094), with the URL holding the state. Rows are marked from the right-click menu or in bulk,
 * then the page reads again so they move to the other table.
 */
export function NotificationTable({ notifications, total, view }: NotificationTableProps) {
  const t = useTranslations("notifications");
  const { navigate, pending } = useQueryNavigation();
  const rows = useNotificationRows({ notifications, total, params: view });
  const router = useRouter();
  const marks = useMarkNotifications({ onMarked: () => router.refresh() });
  const { mark, openOne, pending: marking } = marks;
  const columns = useNotificationColumns({ onOpen: openOne });
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
        rowMenu={(notification) => (
          <NotificationRowMenu {...{ notification, mark, openOne }} disabled={marking} />
        )}
        emptyText={emptyText({ t, view })}
        pagination={pagination}
        manualSorting
        sorting={[{ id: view.sort, desc: view.direction === "desc" }]}
        onSortingChange={(sorting) => navigate({ patch: sortPatch({ sorting }) })}
        selectable
        bulkActions={(selected) => (
          <BulkAction rows={selected} mark={mark} read={view.read === "read"} />
        )}
      />
    </div>
  );
}
