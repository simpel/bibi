"use client";

import type { CalendarLabels } from "../availability-calendar/calendar-labels";
import type { AssetBooking } from "../availability-calendar/calendar-types";
import { PinnedValue } from "../availability-calendar/pinned-facts";
import type { OrderViewFact } from "../order-view/order-view";

export type BookingExtrasInput = { booking: AssetBooking; labels: CalendarLabels };

/** What the booking is worth, large, with its VAT basis: the number staff compare first. */
export function BookingValue({ booking, labels }: BookingExtrasInput) {
  if (!booking.value) return null;
  return (
    <div className="flex items-baseline gap-1.5">
      <PinnedValue booking={booking} className="font-semibold text-foreground text-xl" />
      <span className="text-muted-foreground text-xs">{labels.pinCard.exclVat}</span>
    </div>
  );
}

/** Quantity, hold and buffers of the booking itself, for the expanded pinned card. */
export function bookingFacts({ booking, labels }: BookingExtrasInput): OrderViewFact[] {
  const { pinCard } = labels;
  const facts: OrderViewFact[] = [];
  if (booking.quantity > 1) {
    facts.push({ key: "quantity", label: pinCard.quantity, value: String(booking.quantity) });
  }
  facts.push({ key: "hold", label: pinCard.hold, value: labels.holds[booking.state.hold] });
  const { setupMinutes, teardownMinutes } = booking;
  if (setupMinutes || teardownMinutes) {
    const text = `${setupMinutes} / ${pinCard.minutes({ count: teardownMinutes })}`;
    facts.push({ key: "buffers", label: labels.buffers, value: text });
  }
  return facts;
}
