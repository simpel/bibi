import type { NotificationDto } from "@bibi/core/schemas";
import { useEffect, useState, useTransition } from "react";
import { listNotificationsAction } from "../actions";
import { applyMark } from "../lib/apply-mark";
import type { NotificationListParams } from "../lib/list-params";
import { useNotificationLive } from "./notification-live-context";

export type UseNotificationRowsInput = {
  notifications: NotificationDto[];
  total: number;
  params: NotificationListParams;
};

/**
 * The page's rows as local state (ADR 0094): the caller's marks apply in place, and a change from
 * elsewhere only offers to show it (`stale`), so rows never move under the pointer. `reload`
 * reads the same page with a server action. New server props (paging, sorting, filters) reset it.
 */
export function useNotificationRows({ notifications, total, params }: UseNotificationRowsInput) {
  const { changed, mark } = useNotificationLive();
  const [page, setPage] = useState({ notifications, total, items: notifications, seen: changed });
  const [reloading, startReload] = useTransition();
  if (page.notifications !== notifications) {
    setPage({ notifications, total, items: notifications, seen: changed });
  }
  useEffect(() => {
    if (mark)
      setPage((current) => ({ ...current, items: applyMark({ rows: current.items, mark }) }));
  }, [mark]);
  const reload = () =>
    startReload(async () => {
      const result = await listNotificationsAction({ params });
      if (!result.ok) return;
      const { items, total: count } = result.value;
      setPage((current) => ({ ...current, items, total: count, seen: changed }));
    });
  return {
    rows: page.items,
    total: page.total,
    stale: changed > page.seen,
    reload,
    reloading,
  };
}
