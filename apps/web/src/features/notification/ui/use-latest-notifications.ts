import type { NotificationDto } from "@bibi/core/schemas";
import { useEffect, useState } from "react";
import { loadLatestNotificationsAction } from "../actions";
import { applyMark } from "../lib/apply-mark";
import { useNotificationLive } from "./notification-live-context";

/**
 * The popover's rows (ADR 0094): read with a server action each time it opens, and again when the
 * stream reports a change while it is open. `null` until the first read. The caller's own marks
 * apply locally.
 */
export function useLatestNotifications({ open }: { open: boolean }) {
  const { changed, mark } = useNotificationLive();
  const [rows, setRows] = useState<NotificationDto[] | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `changed` is the trigger to read again
  useEffect(() => {
    if (!open) return;
    let current = true;
    void loadLatestNotificationsAction().then((result) => {
      if (current && result.ok) setRows(result.value);
    });
    return () => {
      current = false;
    };
  }, [open, changed]);
  useEffect(() => {
    if (mark) setRows((list) => (list ? applyMark({ rows: list, mark }) : list));
  }, [mark]);
  return rows;
}
