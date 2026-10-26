"use client";

import {
  type AssetBooking,
  BookingSheet,
  type CalendarAsset,
  type CalendarTicket,
  ticketOfBooking,
} from "@bibi/ui";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/lib/navigation";
import type { TicketDay } from "../load-ticket-day";
import { loadTicketDayAction } from "../ticket-actions";

export type CalendarBookingSheetProps = {
  /** The booking whose ticket is open; `null` closes the sheet. */
  open: AssetBooking | null;
  bookings: readonly AssetBooking[];
  assets: readonly CalendarAsset[];
  locale: string;
  onClose: () => void;
};

/** The ticket's other lines that day, read once the sheet opens; none while loading. */
function useTicketDay({ open }: { open: AssetBooking | null }) {
  const [day, setDay] = useState<TicketDay | null>(null);
  const ticketId = open?.ticketId;
  const date = open?.date;
  useEffect(() => {
    setDay(null);
    if (!ticketId || !date) return;
    let current = true;
    loadTicketDayAction({ ticketId, date }).then((result) => {
      if (current && result.ok) setDay(result.value);
    });
    return () => {
      current = false;
    };
  }, [ticketId, date]);
  return day;
}

/** The held bookings' lanes, then the ticket's other timed lines that day (food, activities). */
function withDay({
  ticket,
  day,
  held,
}: {
  ticket: CalendarTicket;
  day: TicketDay;
  held: Set<string>;
}) {
  const others = day.lanes.filter((lane) => !held.has(lane.id));
  return { ...ticket, lines: [...ticket.lines, ...others] };
}

/**
 * Overview to detail on the calendar page: a booking opens its ticket's day beside the calendar,
 * every line of it, and Open ticket leaves for the ticket itself.
 */
export function CalendarBookingSheet({
  open,
  bookings,
  assets,
  locale,
  onClose,
}: CalendarBookingSheetProps) {
  const router = useRouter();
  const day = useTicketDay({ open });
  const ticket = useMemo(() => {
    const base = open ? ticketOfBooking({ booking: open, bookings, assets }) : null;
    if (!base || !day) return base;
    const held = new Set(bookings.flatMap((booking) => (booking.lineId ? [booking.lineId] : [])));
    return withDay({ ticket: base, day, held });
  }, [open, bookings, assets, day]);
  const href = open?.href;
  return (
    <BookingSheet
      ticket={ticket}
      locale={locale}
      onClose={onClose}
      unscheduled={day?.unscheduled ?? []}
      {...(href ? { onOpenTicket: () => router.push(href) } : {})}
    />
  );
}
