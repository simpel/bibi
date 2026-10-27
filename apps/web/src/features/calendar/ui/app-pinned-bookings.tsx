"use client";

import { PinnedBookings } from "@bibi/ui";
import type { ReactNode } from "react";
import { useRouter } from "@/lib/navigation";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { useCalendarText } from "./use-calendar-text";

export type AppPinnedBookingsProps = { organizationId: string; children: ReactNode };

/**
 * Bookings pinned from any calendar card stay along the bottom on every page of the
 * organization, and through a reload of the tab. Their open icon goes to the ticket.
 */
export function AppPinnedBookings({ organizationId, children }: AppPinnedBookingsProps) {
  const labels = useCalendarText();
  const format = useDateTimeFormat();
  const router = useRouter();
  return (
    <PinnedBookings
      key={organizationId}
      labels={labels}
      formatDate={format.date}
      storageKey={`bibi:pinned-bookings:${organizationId}`}
      onOpen={(booking) => {
        if (booking.ticketId) router.push(`/tickets/${booking.ticketId}`);
      }}
    >
      {children}
    </PinnedBookings>
  );
}
