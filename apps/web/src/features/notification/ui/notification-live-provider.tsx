"use client";

import {
  type ReactNode,
  Suspense,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { NotificationMark } from "../lib/apply-mark";
import { type NotificationLive, NotificationLiveContext } from "./notification-live-context";
import { useArrivalToasts } from "./use-arrival-toasts";
import { useNotificationStream } from "./use-notification-stream";

export type NotificationLiveProviderProps = {
  organizationId: string;
  /** The counts the server is still reading; the stream sends them again on connect. */
  counts: Promise<{ unread: number; inboxOpen: number | null }>;
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
  counts,
  children,
}: NotificationLiveProviderProps) {
  const [state, setState] = useState({ unread: 0, changed: 0 });
  const [inboxOpen, setInboxOpen] = useState<number | null>(null);
  const [mark, setMark] = useState<NotificationMark | null>(null);
  const streamed = useRef(false);
  const toasts = useArrivalToasts();
  useNotificationStream({
    organizationId,
    onUnread: ({ unread, arrived }) => {
      streamed.current = true;
      setState((current) =>
        current.unread === unread ? current : { unread, changed: current.changed + 1 },
      );
      if (arrived) toasts.notification({ notification: arrived });
    },
    onInbox: ({ open, arrived }) => {
      streamed.current = true;
      setInboxOpen(open);
      if (arrived) toasts.message(arrived);
    },
  });
  const applyMark = useCallback<NotificationLive["applyMark"]>(({ ids, read, unread }) => {
    setState((current) => ({ ...current, unread }));
    setMark({ ids, read, at: new Date() });
  }, []);
  const seed = useCallback<SeedCountsProps["onSeed"]>(({ unread, inboxOpen: open }) => {
    // The stream's counts are newer than the server's first read.
    if (streamed.current) return;
    setState((current) => ({ ...current, unread }));
    setInboxOpen(open);
  }, []);
  const value = useMemo(
    () => ({ ...state, inboxOpen, mark, applyMark }),
    [state, inboxOpen, mark, applyMark],
  );
  return (
    <NotificationLiveContext value={value}>
      <Suspense fallback={null}>
        <SeedCounts counts={counts} onSeed={seed} />
      </Suspense>
      {children}
    </NotificationLiveContext>
  );
}

type SeedCountsProps = {
  counts: NotificationLiveProviderProps["counts"];
  onSeed: (input: { unread: number; inboxOpen: number | null }) => void;
};

/** Unwraps the server's counts (`use`) and hands them to the provider once they are read. */
function SeedCounts({ counts, onSeed }: SeedCountsProps) {
  const value = use(counts);
  // Syncing a server promise into the provider's state, which the stream also moves.
  useEffect(() => onSeed(value), [value, onSeed]);
  return null;
}
