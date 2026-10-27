"use client";

import { type ReactNode, useMemo } from "react";
import type { CalendarAsset } from "./calendar-types";
import { PinnedBookings, type PinnedBookingsProps } from "./pinned-bookings";
import { type PinsApi, PinsContext, usePins } from "./pins-context";

export type PinScopeProps = Omit<PinnedBookingsProps, "children" | "storageKey"> & {
  assets: readonly CalendarAsset[];
  children: ReactNode;
};

/** Pins from this calendar carry their asset's name, which the tray shows away from the row. */
function WithAssetNames({ assets, pins, children }: { pins: PinsApi } & PinScopeProps) {
  const api = useMemo<PinsApi>(
    () => ({
      ...pins,
      toggle: ({ booking }) =>
        pins.toggle({
          booking: { ...booking, assetName: assets.find((a) => a.id === booking.assetId)?.name },
        }),
    }),
    [pins, assets],
  );
  return <PinsContext.Provider value={api}>{children}</PinsContext.Provider>;
}

/**
 * The calendar's way into the app's pins. Without an app-wide `PinnedBookings` (a story, an
 * embed) it keeps its own, so pinning still works there.
 */
export function PinScope(props: PinScopeProps) {
  const pins = usePins();
  if (pins) return <WithAssetNames pins={pins} {...props} />;
  const { assets, children, ...tray } = props;
  return (
    <PinnedBookings {...tray}>
      <PinScope assets={assets} {...tray}>
        {children}
      </PinScope>
    </PinnedBookings>
  );
}
