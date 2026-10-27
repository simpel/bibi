"use client";

import type { ReactNode } from "react";
import { ContactName, type NamedContact } from "../person-contact/contact-name";
import { BookingActions } from "./booking-actions";
import { type CalendarLabels, useCalendarLabels } from "./calendar-labels";
import type { AssetBooking } from "./calendar-types";

export type BookingDetailsProps = {
  booking: AssetBooking;
  /** Opens the booking's ticket: the card's one action. */
  onOpen?: (() => void) | undefined;
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

/** Names only, side by side; each opens that person's contact card. */
function Names({ people }: { people: readonly NamedContact[] }) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {people.map((person) => (
        <ContactName key={person.id ?? person.name} contact={person} />
      ))}
    </span>
  );
}

/** Who to call on each side, by name: the customer's contact, then ours, then who works it. */
function Contacts({ booking }: { booking: AssetBooking }) {
  const { client, contact, staff } = booking;
  const labels = useCalendarLabels();
  if (!client && !contact && !staff?.length) return null;
  return (
    <dl className="grid grid-cols-[3.75rem_1fr] items-baseline gap-x-3 gap-y-1.5 border-t pt-2.5 text-xs">
      {client ? (
        <Row label={labels.client}>
          <Names
            people={[{ ...client, description: booking.customer ?? undefined, avatar: false }]}
          />
        </Row>
      ) : null}
      {contact ? (
        <Row label={labels.internal}>
          <Names people={[{ ...contact.person, description: contact.via || undefined }]} />
        </Row>
      ) : null}
      {staff?.length ? (
        <Row label={labels.staff}>
          <Names people={staff.map((person) => ({ ...person, description: person.role }))} />
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
 * who to call on either side. Time and state are already on the block. Pin it to compare.
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
        <BookingActions booking={booking} onOpen={onOpen} />
      </div>
      {booking.notes ? <p className="text-xs leading-relaxed">{booking.notes}</p> : null}
      <Contacts booking={booking} />
    </div>
  );
}
