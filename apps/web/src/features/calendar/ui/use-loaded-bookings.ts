import type { AssetBooking } from "@bibi/ui";
import { useCallback, useRef, useState } from "react";
import { loadCalendarBookingsAction } from "../actions";

type DayRange = { from: string; to: string };

const dayBefore = ({ date }: { date: string }) =>
  new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

const dayAfter = ({ date }: { date: string }) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

/** The days of `wanted` not yet in `covered`: the timeline only ever grows at its two edges. */
function missingOf({ wanted, covered }: { wanted: DayRange; covered: DayRange | null }) {
  if (!covered) return [wanted];
  const missing: DayRange[] = [];
  if (wanted.from < covered.from)
    missing.push({ from: wanted.from, to: dayBefore({ date: covered.from }) });
  if (wanted.to > covered.to) missing.push({ from: dayAfter({ date: covered.to }), to: wanted.to });
  return missing;
}

/**
 * The bookings of every day the timeline has loaded: the page's first days, then each new edge
 * as it scrolls, once. A failed load leaves its days to the next attempt.
 */
export function useLoadedBookings({
  initial,
  range,
}: {
  initial: AssetBooking[];
  range: DayRange;
}) {
  const [bookings, setBookings] = useState(initial);
  const [failed, setFailed] = useState(false);
  const covered = useRef<DayRange | null>(range);
  const onRangeChange = useCallback((wanted: DayRange) => {
    const before = covered.current;
    const missing = missingOf({ wanted, covered: before });
    if (missing.length === 0) return;
    covered.current = before
      ? {
          from: wanted.from < before.from ? wanted.from : before.from,
          to: wanted.to > before.to ? wanted.to : before.to,
        }
      : wanted;
    for (const days of missing) {
      loadCalendarBookingsAction(days).then((result) => {
        if (!result.ok) {
          covered.current = before;
          setFailed(true);
          return;
        }
        setFailed(false);
        setBookings((current) => {
          const ids = new Set(current.map((booking) => booking.id));
          return [...current, ...result.value.filter((booking) => !ids.has(booking.id))];
        });
      });
    }
  }, []);
  return { bookings, failed, onRangeChange };
}
