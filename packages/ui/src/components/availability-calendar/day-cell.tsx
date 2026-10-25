"use client";

import { type FormatDate, formatDay } from "./calendar-dates";
import { type CalendarLabels, useCalendarLabels } from "./calendar-labels";
import { markStyle } from "./calendar-marks";
import type { AssetBooking, CalendarWindow } from "./calendar-types";
import { occupancyOf } from "./day-occupancy";

export type DayCellProps = {
  assetName: string;
  date: string;
  bookings: readonly AssetBooking[];
  hours: CalendarWindow;
  /** The user's date format. */
  formatDate: FormatDate;
  /** Zooms in to this day. */
  onDrill: (input: { date: string }) => void;
};

type DescribeInput = Omit<DayCellProps, "onDrill"> & { labels: CalendarLabels };

function describe({ assetName, date, bookings, hours, formatDate, labels }: DescribeInput) {
  const { share, clash, count } = occupancyOf({ bookings, hours });
  const day = formatDay({ date, format: formatDate });
  const percent = Math.round(share * 100);
  return labels.dayCell({ asset: assetName, day, percent, count, clash });
}

/**
 * A month's day for one asset: a bar as tall as the booked share of the open hours, marked like a
 * block in the state that covers most of it, with a red notch on a clash. Click zooms in to the day.
 */
export function DayCell(props: DayCellProps) {
  const { share, state, clash } = occupancyOf({ bookings: props.bookings, hours: props.hours });
  const labels = useCalendarLabels();
  const label = describe({ ...props, labels });
  return (
    <button
      type="button"
      aria-label={labels.openDay({ label })}
      title={label}
      onClick={() => props.onDrill({ date: props.date })}
      className="group absolute inset-0.5 cursor-zoom-in overflow-hidden rounded-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
    >
      {state ? (
        <span
          className="absolute inset-x-0.5 bottom-0.5 rounded-xs border"
          style={{
            height: `max(0.25rem, calc(${share * 100}% - 0.25rem))`,
            ...markStyle({ state, audience: "internal" }),
          }}
        />
      ) : null}
      {clash ? <span className="absolute inset-x-0 top-0 h-1 bg-destructive" /> : null}
    </button>
  );
}
