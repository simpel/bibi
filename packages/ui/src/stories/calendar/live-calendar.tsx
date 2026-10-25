"use client";

import {
  AvailabilityCalendar,
  type AvailabilityCalendarProps,
} from "../../components/availability-calendar/availability-calendar";
import type { AssetBooking } from "../../components/availability-calendar/calendar-types";
import { STORY_CALENDAR } from "./story-labels";
import { useStoryBookings } from "./use-story-bookings";

type AppProps = "bookings" | "onRangeChange" | keyof typeof STORY_CALENDAR;

export type LiveCalendarProps = Omit<AvailabilityCalendarProps, AppProps> & {
  /** The story day's bookings; other days are made from them as they load. */
  template: readonly AssetBooking[];
};

/** The calendar as a story uses it: bookings "load" as the timeline reaches new days. */
export function LiveCalendar({ template, ...props }: LiveCalendarProps) {
  const { bookings, onRangeChange } = useStoryBookings({ template });
  return (
    <AvailabilityCalendar
      {...STORY_CALENDAR}
      {...props}
      bookings={bookings}
      onRangeChange={onRangeChange}
    />
  );
}
