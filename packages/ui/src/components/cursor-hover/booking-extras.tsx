"use client";

import type { CalendarLabels } from "../availability-calendar/calendar-labels";
import type { AssetBooking } from "../availability-calendar/calendar-types";
import { StatusBadge } from "../data-table/data-table-column-helpers";
import { type KeyFact, KeyFacts } from "../key-facts/key-facts";
import type { OrderViewFact } from "../order-view/order-view";

export type BookingExtrasInput = { booking: AssetBooking; labels: CalendarLabels };

/** Every plain-text fact opens the order; a person's name keeps its own contact card. */
export function openable({
  facts,
  onOpen,
}: {
  facts: readonly OrderViewFact[];
  onOpen?: (() => void) | undefined;
}): OrderViewFact[] {
  if (!onOpen) return [...facts];
  return facts.map((fact) =>
    typeof fact.value === "string" ? { ...fact, onSelect: onOpen } : fact,
  );
}

export type BookingStatsInput = BookingExtrasInput & {
  /** Only the detailed card shows stats. */
  detailed: boolean;
  time?: string | undefined;
  /** Makes every stat open the booking's order. */
  onOpen?: (() => void) | undefined;
  /** The day, a tiny line above the time. */
  date?: string | undefined;
  resource?: string | undefined;
};

/**
 * The booking's figures as tiny stats when detailed: its state (a badge in its colour), guests, when
 * and where. Its value is not one: the order's total is among the facts.
 */
export function BookingStats({
  booking,
  labels,
  detailed,
  time,
  date,
  resource,
  onOpen,
}: BookingStatsInput) {
  const { pinCard } = labels;
  if (!detailed) return null;
  const facts: KeyFact[] = [];
  const { state, status } = booking;
  if (status) {
    const value = <StatusBadge tinted label={status.name} color={status.color} />;
    facts.push({ label: pinCard.status, value, onSelect: onOpen });
  } else if (state.name) {
    const value = <StatusBadge tinted label={state.name} color={state.color} />;
    facts.push({ label: pinCard.state, value, onSelect: onOpen });
  }
  if (booking.headcount) {
    facts.push({ label: pinCard.guests, value: booking.headcount, onSelect: onOpen });
  }
  if (time) facts.push({ label: pinCard.when, preheader: date, value: time, onSelect: onOpen });
  if (resource) {
    facts.push({
      label: pinCard.where,
      value: resource,
      truncate: true,
      title: resource,
      onSelect: onOpen,
    });
  }
  return facts.length > 0 ? <KeyFacts size="sm" facts={facts} /> : null;
}

/** The booking's buffers, for the expanded pinned card. */
export function bookingFacts({ booking, labels }: BookingExtrasInput): OrderViewFact[] {
  const { setupMinutes, teardownMinutes } = booking;
  if (!setupMinutes && !teardownMinutes) return [];
  const text = `${setupMinutes} / ${labels.pinCard.minutes({ count: teardownMinutes })}`;
  return [{ key: "buffers", label: labels.buffers, value: text }];
}
