"use client";

import type { CalendarLabels } from "../availability-calendar/calendar-labels";
import type { AssetBooking } from "../availability-calendar/calendar-types";
import { PinnedValue } from "../availability-calendar/pinned-facts";
import { type KeyFact, KeyFacts } from "../key-facts/key-facts";
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
  const facts: KeyFact[] = [];
  if (booking.value) {
    facts.push({
      label: pinCard.value,
      value: <PinnedValue booking={booking} />,
      title: pinCard.exclVat,
    });
  }
  if (detailed && booking.quantity > 1) {
    facts.push({ label: pinCard.quantity, value: booking.quantity });
  }
  if (detailed && time) facts.push({ label: pinCard.when, value: time });
  if (detailed && resource) {
    facts.push({ label: pinCard.where, value: resource, truncate: true, title: resource });
  }
  return <KeyFacts size="sm" facts={facts} className="border-y border-border/60 py-2" />;
}

/** The booking's buffers, for the expanded pinned card. */
export function bookingFacts({ booking, labels }: BookingExtrasInput): OrderViewFact[] {
  const { setupMinutes, teardownMinutes } = booking;
  if (!setupMinutes && !teardownMinutes) return [];
  const text = `${setupMinutes} / ${labels.pinCard.minutes({ count: teardownMinutes })}`;
  return [{ key: "buffers", label: labels.buffers, value: text }];
}
