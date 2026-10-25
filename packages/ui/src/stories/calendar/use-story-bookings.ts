"use client";

import { useCallback, useMemo, useState } from "react";
import type { AssetBooking } from "../../components/availability-calendar/calendar-types";
import { rangeBookings } from "./range-bookings-data";
import { STORY_DAY } from "./story-dates";

/** A story's stand-in for loading bookings as the timeline reaches new days. */
export function useStoryBookings({ template }: { template: readonly AssetBooking[] }) {
  const [range, setRange] = useState({ from: STORY_DAY, to: STORY_DAY });
  const bookings = useMemo(() => rangeBookings({ ...range, template }), [range, template]);
  const onRangeChange = useCallback(
    (next: { from: string; to: string }) =>
      setRange((current) =>
        current.from === next.from && current.to === next.to ? current : next,
      ),
    [],
  );
  return { bookings, onRangeChange };
}
