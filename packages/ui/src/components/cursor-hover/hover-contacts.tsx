"use client";

import type { ReactNode } from "react";
import type { CalendarLabels } from "../availability-calendar/calendar-labels";
import type { AssetBooking } from "../availability-calendar/calendar-types";
import { ContactName, type NamedContact } from "../person-contact/contact-name";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

function Names({ people }: { people: readonly NamedContact[] }) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {people.map((person) => (
        <ContactName key={person.id ?? person.name} contact={person} />
      ))}
    </span>
  );
}

export function BookingContacts({
  booking,
  labels,
}: {
  booking: AssetBooking;
  labels: CalendarLabels | null;
}) {
  const { client, contact, staff } = booking;
  if (!client && !contact && !staff?.length) return null;
  const clientLabel = labels?.client ?? "Client";
  const internalLabel = labels?.internal ?? "Internal";
  const staffLabel = labels?.staff ?? "Staff";

  return (
    <dl className="grid grid-cols-[3.75rem_1fr] items-baseline gap-x-3 gap-y-1.5 border-t border-border/60 pt-2 text-xs">
      {client ? (
        <Row label={clientLabel}>
          <Names
            people={[{ ...client, description: booking.customer ?? undefined, avatar: false }]}
          />
        </Row>
      ) : null}
      {contact ? (
        <Row label={internalLabel}>
          <Names people={[{ ...contact.person, description: contact.via || undefined }]} />
        </Row>
      ) : null}
      {staff?.length ? (
        <Row label={staffLabel}>
          <Names people={staff.map((person) => ({ ...person, description: person.role }))} />
        </Row>
      ) : null}
    </dl>
  );
}
