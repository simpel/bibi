"use client";

import { type ReactNode, useMemo } from "react";
import type { FormatDate } from "./calendar-dates";
import { type CalendarLabels, CalendarLabelsProvider } from "./calendar-labels";
import type { AssetBooking } from "./calendar-types";
import { PinnedTray } from "./pinned-tray";
import { type PinsApi, PinsContext } from "./pins-context";
import { useStoredPins } from "./use-stored-pins";

export type PinnedBookingsProps = {
  children: ReactNode;
  labels: CalendarLabels;
  formatDate: FormatDate;
  /** Opens a pinned booking's ticket, from wherever the tray is. */
  onOpen?: ((booking: AssetBooking) => void) | undefined;
  /** Session storage key, e.g. per organization; pins then survive a reload. */
  storageKey?: string | undefined;
};

/**
 * Holds the bookings pinned from their cards and lays them out side by side to compare. Mount
 * it once around the app: the tray stays on every page until each pin is taken off.
 */
export function PinnedBookings({ children, labels, storageKey, ...tray }: PinnedBookingsProps) {
  const [pins, setPins] = useStoredPins({ key: storageKey });
  const api = useMemo<PinsApi>(
    () => ({
      pins,
      isPinned: ({ id }) => pins.some((pin) => pin.id === id),
      toggle: ({ booking }) =>
        setPins((list) =>
          list.some((pin) => pin.id === booking.id)
            ? list.filter((pin) => pin.id !== booking.id)
            : [...list, booking],
        ),
    }),
    [pins, setPins],
  );
  return (
    <PinsContext.Provider value={api}>
      {children}
      <CalendarLabelsProvider labels={labels}>
        <PinnedTray pins={pins} onClose={api.toggle} {...tray} />
      </CalendarLabelsProvider>
    </PinsContext.Provider>
  );
}
