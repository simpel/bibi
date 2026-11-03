import { createContext, useContext } from "react";
import type { NotificationMark } from "../lib/apply-mark";

export type NotificationLive = {
  /** The caller's unread count, kept live by the stream. */
  unread: number;
  /** Bumps when the stream moves the count, i.e. something changed elsewhere. */
  changed: number;
  /** The caller's latest read state change, for lists to apply locally. */
  mark: NotificationMark | null;
  /** After a mark succeeded: the new count, and the change for every list to apply. */
  applyMark: (input: { ids: string[] | "all"; read: boolean; unread: number }) => void;
};

export const NotificationLiveContext = createContext<NotificationLive>({
  unread: 0,
  changed: 0,
  mark: null,
  applyMark: () => {},
});

/** The shell's live notification state (ADR 0094). */
export const useNotificationLive = () => useContext(NotificationLiveContext);
