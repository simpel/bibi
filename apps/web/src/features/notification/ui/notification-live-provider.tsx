"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import type { NotificationMark } from "../lib/apply-mark";
import { type NotificationLive, NotificationLiveContext } from "./notification-live-context";
import { useArrivalToasts } from "./use-arrival-toasts";
import { useNotificationStream } from "./use-notification-stream";

export type NotificationLiveProviderProps = {
  organizationId: string;
  /** The counts the server rendered. */
  unread: number;
  inboxOpen: number | null;
  children: ReactNode;
};

/**
 * Holds the unread count for the bell and the list, and the inbox's open count for the sidebar
 * (ADR 0094). The stream moves it; a mark the
 * caller made moves it first, so the stream's echo of the same count is not a change. What just
 * came in (a notification, an inbox message) is also toasted.
 */
export function NotificationLiveProvider({
  organizationId,
  unread: initial,
  inboxOpen: initialInbox,
  children,
}: NotificationLiveProviderProps) {
  const [state, setState] = useState({ unread: initial, changed: 0 });
  const [inboxOpen, setInboxOpen] = useState(initialInbox);
  const [mark, setMark] = useState<NotificationMark | null>(null);
  useEffect(() => setState((current) => ({ ...current, unread: initial })), [initial]);
  useEffect(() => setInboxOpen(initialInbox), [initialInbox]);
  const toasts = useArrivalToasts();
  useNotificationStream({
    organizationId,
    onUnread: ({ unread, arrived }) => {
      setState((current) =>
        current.unread === unread ? current : { unread, changed: current.changed + 1 },
      );
      if (arrived) toasts.notification();
    },
    onInbox: ({ open, arrived }) => {
      setInboxOpen(open);
      if (arrived) toasts.message(arrived);
    },
  });
  const applyMark = useCallback<NotificationLive["applyMark"]>(({ ids, read, unread }) => {
    setState((current) => ({ ...current, unread }));
    setMark({ ids, read, at: new Date() });
  }, []);
  const value = useMemo(
    () => ({ ...state, inboxOpen, mark, applyMark }),
    [state, inboxOpen, mark, applyMark],
  );
  return <NotificationLiveContext value={value}>{children}</NotificationLiveContext>;
}
