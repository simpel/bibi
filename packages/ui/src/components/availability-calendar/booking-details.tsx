"use client";

import { SquareArrowOutUpRightIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../button/button";
import { PersonContact } from "../person-contact/person-contact";
import { type CalendarLabels, useCalendarLabels } from "./calendar-labels";
import { StaffList } from "./calendar-people";
import type { AssetBooking } from "./calendar-types";

export type BookingDetailsProps = {
  booking: AssetBooking;
  /** Opens the booking's ticket: the card's one action. */
  onOpen?: () => void;
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="pt-1 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

/** Who to call on each side: the customer's contact, then ours. */
function Contacts({ booking }: { booking: AssetBooking }) {
  const { client, contact, staff } = booking;
  const labels = useCalendarLabels();
  if (!client && !contact && !staff?.length) return null;
  return (
    <dl className="grid grid-cols-[3.75rem_1fr] gap-x-3 gap-y-2.5 border-t pt-2.5">
      {client ? (
        <Row label={labels.client}>
          <PersonContact
            size="compact"
            avatar={false}
            name={client.name}
            phone={client.phone}
            email={client.email}
          />
        </Row>
      ) : null}
      {contact ? (
        <Row label={labels.internal}>
          <PersonContact
            size="compact"
            name={contact.person.name}
            description={contact.via || undefined}
            phone={contact.person.phone}
            email={contact.person.email}
            photoUrl={contact.person.photoUrl}
          />
        </Row>
      ) : null}
      {staff?.length ? (
        <Row label={labels.staff}>
          <StaffList staff={staff} label={false} />
        </Row>
      ) : null}
    </dl>
  );
}

/** Guests and what the booking is worth; a block says it is not sold. */
function subtitle({ booking, labels }: { booking: AssetBooking; labels: CalendarLabels }) {
  if (!booking.ticket) return `${labels.blocked}, ${labels.notSold}`;
  const guests = booking.headcount ? labels.guests({ count: booking.headcount }) : booking.name;
  const amount = booking.value ? labels.money(booking.value) : "";
  const value = amount ? labels.exclVat({ amount }) : "";
  return [guests, value].filter(Boolean).join(" · ");
}

/** The client's name opens the ticket, like the icon beside it: two ways in, one place. */
function Title({ booking, onOpen }: BookingDetailsProps) {
  const title = booking.customer ?? booking.name;
  if (!onOpen || !booking.ticket) return <p className="font-medium">{title}</p>;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left font-medium underline-offset-2 outline-none hover:underline focus-visible:underline"
    >
      {title}
    </button>
  );
}

/**
 * A booking in the overview: the client, guests and value, notes, the way into the ticket, and
 * who to call on either side. Time and state are already on the block.
 */
export function BookingDetails({ booking, onOpen }: BookingDetailsProps) {
  const labels = useCalendarLabels();
  return (
    <div className="grid gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="grid min-w-0">
          <Title booking={booking} onOpen={onOpen} />
          <p className="text-xs text-muted-foreground tabular-nums">
            {subtitle({ booking, labels })}
          </p>
        </div>
        {onOpen && booking.ticket ? (
          <Button
            size="icon"
            variant="ghost"
            className="-my-1 -mr-1.5 size-8 shrink-0"
            onClick={onOpen}
            aria-label={labels.open({ ticket: booking.ticket })}
            title={labels.open({ ticket: booking.ticket })}
          >
            <SquareArrowOutUpRightIcon aria-hidden />
          </Button>
        ) : null}
      </div>
      {booking.notes ? <p className="text-xs leading-relaxed">{booking.notes}</p> : null}
      <Contacts booking={booking} />
    </div>
  );
}
