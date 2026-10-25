"use client";

import { AvailabilityCalendar, type AvailabilityCalendarProps } from "./availability-calendar";
import type { AssetBooking } from "./calendar-types";
import { useStoryBookings } from "./use-story-bookings";

export type LiveCalendarProps = Omit<AvailabilityCalendarProps, "bookings" | "onRangeChange"> & {
  /** The story day's bookings; other days are made from them as they load. */
  template: readonly AssetBooking[];
};

/** The calendar as a story uses it: bookings "load" as the timeline reaches new days. */
export function LiveCalendar({ template, ...props }: LiveCalendarProps) {
  const { bookings, onRangeChange } = useStoryBookings({ template });
  return <AvailabilityCalendar {...props} bookings={bookings} onRangeChange={onRangeChange} />;
}
