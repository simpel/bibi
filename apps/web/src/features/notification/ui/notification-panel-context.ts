import { createContext, useContext } from "react";
import type { MyWorkTaskWireish } from "@/features/my-work/ui/my-work-wireish";

export type NotificationPanel = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /**
   * Needs you for the panel's top section: `undefined` while the shell's first read is under way,
   * `null` without `order:read`.
   */
  tasks: readonly MyWorkTaskWireish[] | null | undefined;
  /** Tasks dismissed on this page, greyed out until the next one (ADR 0114). */
  dimmed: ReadonlySet<string>;
  /** After a dismissal is saved. */
  markDismissed: (input: { key: string }) => void;
};

export const NotificationPanelContext = createContext<NotificationPanel>({
  open: false,
  setOpen: () => {},
  tasks: undefined,
  dimmed: new Set(),
  markDismissed: () => {},
});

/** The notification panel on the right of the shell: whether it is open, and Needs you. */
export const useNotificationPanel = () => useContext(NotificationPanelContext);
