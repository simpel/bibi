"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import type { NotificationMark } from "../lib/apply-mark";
import { type NotificationLive, NotificationLiveContext } from "./notification-live-context";
import { useNotificationStream } from "./use-notification-stream";

export type NotificationLiveProviderProps = {
  organizationId: string;
  /** The count the server rendered. */
  unread: number;
  children: ReactNode;
};

/**
 * Holds the unread count for the bell and the list (ADR 0094). The stream moves it; a mark the
 * caller made moves it first, so the stream's echo of the same count is not a change.
 */
export function NotificationLiveProvider({
  organizationId,
  unread: initial,
  children,
}: NotificationLiveProviderProps) {
  const [state, setState] = useState({ unread: initial, changed: 0 });
  const [mark, setMark] = useState<NotificationMark | null>(null);
  useEffect(() => setState((current) => ({ ...current, unread: initial })), [initial]);
  useNotificationStream({
    organizationId,
    onUnread: (unread) =>
      setState((current) =>
        current.unread === unread ? current : { unread, changed: current.changed + 1 },
      ),
  });
  const applyMark = useCallback<NotificationLive["applyMark"]>(({ ids, read, unread }) => {
    setState((current) => ({ ...current, unread }));
    setMark({ ids, read, at: new Date() });
  }, []);
  const value = useMemo(() => ({ ...state, mark, applyMark }), [state, mark, applyMark]);
  return <NotificationLiveContext value={value}>{children}</NotificationLiveContext>;
}
