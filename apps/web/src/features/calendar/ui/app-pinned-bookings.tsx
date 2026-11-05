"use client";

import { PinnedBookings } from "@bibi/ui";
import type { ReactNode } from "react";
import { useRouter } from "@/lib/navigation";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { useCalendarText } from "./use-calendar-text";
import { usePinnedOrderFacts } from "./use-pinned-order-facts";

export type AppPinnedBookingsProps = { organizationId: string; children: ReactNode };

/**
 * Bookings pinned from any calendar card stay along the bottom on every page of the
 * organization, and through a reload of the tab. Their open icon goes to the order.
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
      useExtraFacts={usePinnedOrderFacts}
      storageKey={`bibi:pinned-bookings:${organizationId}`}
      onOpen={(booking) => {
        if (booking.orderId) router.push(`/orders/${booking.orderId}`);
      }}
    >
      {children}
    </PinnedBookings>
  );
}
