"use client";

import { SquareArrowOutUpRightIcon } from "lucide-react";
import { Button } from "../button/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../sheet/sheet";
import { useCalendarLabels } from "./calendar-labels";
import type { CalendarTicket } from "./calendar-types";
import { TicketLanes } from "./ticket-lanes";

export type BookingSheetProps = {
  /** The booking's ticket; `null` closes the sheet. */
  ticket: CalendarTicket | null;
  locale: string;
  onClose: () => void;
  /** Leaves the calendar for the ticket itself. */
  onOpenTicket?: () => void;
};

/**
 * Overview to detail: a booking's ticket, its lines that day on one hour axis, beside the
 * calendar. Closing returns to the same place; the booking stays ringed behind it.
 */
export function BookingSheet({ ticket, locale, onClose, onOpenTicket }: BookingSheetProps) {
  const labels = useCalendarLabels();
  return (
    <Sheet open={Boolean(ticket)} onOpenChange={(next) => (next ? null : onClose())}>
      <SheetContent
        className="w-full overflow-y-auto sm:max-w-3xl"
        // Focus the sheet, not its first block: a focused block would pop its hover card.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus();
        }}
      >
        <SheetHeader>
          <SheetTitle>{ticket?.reference}</SheetTitle>
          <SheetDescription>{ticket?.customer}</SheetDescription>
          {onOpenTicket && ticket ? (
            <Button size="sm" variant="outline" className="w-fit" onClick={onOpenTicket}>
              <SquareArrowOutUpRightIcon aria-hidden />
              {labels.open({ ticket: ticket.reference })}
            </Button>
          ) : null}
        </SheetHeader>
        <div className="px-4 pb-6">
          {ticket ? <TicketLanes ticket={ticket} audience="internal" locale={locale} /> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
