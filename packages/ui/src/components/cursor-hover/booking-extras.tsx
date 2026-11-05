"use client";

import type { CalendarLabels } from "../availability-calendar/calendar-labels";
import type { AssetBooking } from "../availability-calendar/calendar-types";
import { PinnedValue } from "../availability-calendar/pinned-facts";
import { MiniStat, MiniStatRow } from "../mini-stat/mini-stat";
import type { OrderViewFact } from "../order-view/order-view";

export type BookingExtrasInput = { booking: AssetBooking; labels: CalendarLabels };

export type BookingStatsInput = BookingExtrasInput & {
  /** Adds quantity, time and the booked thing to the value. */
  detailed: boolean;
  time?: string | undefined;
  resource?: string | undefined;
};

/** The booking's figures as tiny stats: what it is worth and, when detailed, what, when, where. */
export function BookingStats({ booking, labels, detailed, time, resource }: BookingStatsInput) {
  const { pinCard } = labels;
  const hasValue = Boolean(booking.value);
  const hasMore = detailed && Boolean(time || resource || booking.quantity > 1);
  if (!hasValue && !hasMore) return null;
  return (
    <MiniStatRow>
      {booking.value ? (
        <MiniStat
          label={pinCard.value}
          title={pinCard.exclVat}
          value={<PinnedValue booking={booking} />}
        />
      ) : null}
      {detailed && booking.quantity > 1 ? (
        <MiniStat label={pinCard.quantity} value={booking.quantity} />
      ) : null}
      {detailed && time ? <MiniStat label={pinCard.when} value={time} /> : null}
      {detailed && resource ? (
        <MiniStat label={pinCard.where} value={resource} title={resource} />
      ) : null}
    </MiniStatRow>
  );
}

/** The booking's buffers, for the expanded pinned card. */
export function bookingFacts({ booking, labels }: BookingExtrasInput): OrderViewFact[] {
  const { setupMinutes, teardownMinutes } = booking;
  if (!setupMinutes && !teardownMinutes) return [];
  const text = `${setupMinutes} / ${labels.pinCard.minutes({ count: teardownMinutes })}`;
  return [{ key: "buffers", label: labels.buffers, value: text }];
}
