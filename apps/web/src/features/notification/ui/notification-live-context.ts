import { createContext, useContext } from "react";
import type { NotificationMark } from "../lib/apply-mark";

export type NotificationLive = {
  /** The caller's unread count, kept live by the stream. */
  unread: number;
  /** Open inbox messages (ADR 0085), live too; null without `inbox:read`. */
  inboxOpen: number | null;
  /** Bumps when the stream moves the count, i.e. something changed elsewhere. */
  changed: number;
  /** The caller's latest read state change, for lists to apply locally. */
  mark: NotificationMark | null;
  /** After a mark succeeded: the new count, and the change for every list to apply. */
  applyMark: (input: { ids: string[] | "all"; read: boolean; unread: number }) => void;
};

export const NotificationLiveContext = createContext<NotificationLive>({
  unread: 0,
  inboxOpen: null,
  changed: 0,
  mark: null,
  applyMark: () => {},
});

/** The shell's live counts (ADR 0094): notifications, and the inbox on the same stream. */
export const useNotificationLive = () => useContext(NotificationLiveContext);
