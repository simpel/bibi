"use client";

import type { CalendarLabels } from "../availability-calendar/calendar-labels";
import type { AssetBooking } from "../availability-calendar/calendar-types";
import type { OrderViewFact } from "../order-view/order-view";
import { ContactName, type NamedContact } from "../person-contact/contact-name";

function Names({ people }: { people: readonly NamedContact[] }) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {people.map((person) => (
        <ContactName key={person.id ?? person.name} contact={person} />
      ))}
    </span>
  );
}

export type ContactFactsInput = { booking: AssetBooking; labels: CalendarLabels | null };

/** The booking's client, internal contact and staff as `OrderView` facts. */
export function contactFacts({ booking, labels }: ContactFactsInput): OrderViewFact[] {
  const { client, contact, staff } = booking;
  const facts: OrderViewFact[] = [];
  if (client) {
    const people = [{ ...client, description: booking.customer ?? undefined, avatar: false }];
    facts.push({
      key: "client",
      label: labels?.client ?? "Client",
      value: <Names people={people} />,
    });
  }
  if (contact) {
    const people = [{ ...contact.person, description: contact.via || undefined }];
    facts.push({
      key: "internal",
      label: labels?.internal ?? "Internal",
      value: <Names people={people} />,
    });
  }
  if (staff?.length) {
    const people = staff.map((person) => ({ ...person, description: person.role }));
    facts.push({ key: "staff", label: labels?.staff ?? "Staff", value: <Names people={people} /> });
  }
  return facts;
}
