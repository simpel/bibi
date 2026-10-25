"use client";

import { useMemo } from "react";
import type { AssetBooking, CalendarWindow } from "./calendar-types";
import { clipToWindow, openHours } from "./day-window";

export type UseDayWindowInput = {
  bookings: readonly AssetBooking[];
  /** The venues' opening hours, widest across the week; the office day without them. */
  openingHours?: CalendarWindow;
};

/** The window every day shares, and the bookings clipped to it. */
export function useDayWindow({ bookings, openingHours }: UseDayWindowInput) {
  const hours = useMemo(
    () => openHours({ bookings, ...(openingHours ? { base: openingHours } : {}) }),
    [bookings, openingHours],
  );
  const shown = useMemo(() => clipToWindow({ bookings, window: hours }), [bookings, hours]);
  return { hours, bookings: shown };
}
