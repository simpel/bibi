"use client";

import { createContext, useContext } from "react";
import type { AssetBooking } from "./calendar-types";

/** A pinned booking, with the asset's name: the tray shows it away from the calendar. */
export type PinnedBooking = AssetBooking & { assetName?: string | undefined };

export type PinsApi = {
  pins: readonly PinnedBooking[];
  isPinned: (input: { id: string }) => boolean;
  /** Pins the booking to the tray, or takes it off if it is there. */
  toggle: (input: { booking: PinnedBooking }) => void;
};

export const PinsContext = createContext<PinsApi | null>(null);

/** The pins, or null outside a `PinnedBookings`. */
export function usePins() {
  return useContext(PinsContext);
}
