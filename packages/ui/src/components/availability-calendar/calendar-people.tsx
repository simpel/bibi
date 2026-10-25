"use client";

import { cn } from "../../lib/cn";
import { Avatar, type AvatarProps } from "../avatar/avatar";
import { PersonContact } from "../person-contact/person-contact";
import { useCalendarLabels } from "./calendar-labels";
import { visibleLines } from "./calendar-time";
import type {
  CalendarAudience,
  CalendarContact,
  CalendarLine,
  CalendarPerson,
  CalendarTicket,
} from "./calendar-types";

/** Every line gets exactly one contact: its own, else the ticket's (marked inherited). */
export function withContacts({
  lines,
  fallback,
}: {
  lines: readonly CalendarLine[];
  fallback: CalendarContact;
}): CalendarLine[] {
  return lines.map((line) => ({
    ...line,
    contact: line.contact ?? { ...fallback, inherited: true },
  }));
}

/** A ticket's lines as the audience may see them, each with its contact resolved. */
export function ticketLines({
  ticket,
  audience,
}: {
  ticket: CalendarTicket;
  audience: CalendarAudience;
}): CalendarLine[] {
  return withContacts({
    lines: visibleLines({ lines: ticket.lines, audience }),
    fallback: ticket.contact,
  });
}

export type PersonAvatarProps = { person: CalendarPerson; className?: string } & Pick<
  AvatarProps,
  "size"
>;

/** The profile photo, or initials while there is none. Never a hue: hue is the state's. */
export function PersonAvatar({ person, size = "sm", className }: PersonAvatarProps) {
  return (
    <Avatar
      name={person.name}
      photoUrl={person.photoUrl}
      size={size}
      title={`${person.name} · ${person.role}`}
      className={cn("ring-2 ring-card", className)}
    />
  );
}

export type LineContactProps = {
  contact: CalendarContact;
  /** Why them ("from ticket" if inherited). Off where only name and number fit. */
  why?: boolean;
};

/** The one person to reach about a line: name, why them, number. */
export function LineContact({ contact, why = true }: LineContactProps) {
  const { person, via, inherited } = contact;
  const labels = useCalendarLabels();
  return (
    <PersonContact
      size="compact"
      name={person.name}
      description={why ? (inherited ? labels.fromTicket({ via }) : via) : undefined}
      phone={person.phone}
      photoUrl={person.photoUrl}
    />
  );
}

export type StaffListProps = {
  staff?: readonly CalendarPerson[];
  /** Leading "Staff" label; off where the surrounding grid already names the row. */
  label?: boolean;
};

/** Who works the line: name and role each, wrapping side by side. */
export function StaffList({ staff, label = true }: StaffListProps) {
  const labels = useCalendarLabels();
  if (!staff?.length) return null;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5">
      {label ? <span className="text-xs text-muted-foreground">{labels.staff}</span> : null}
      {staff.map((person) => (
        <PersonContact
          key={person.id}
          size="mini"
          name={person.name}
          description={person.role}
          photoUrl={person.photoUrl}
        />
      ))}
    </div>
  );
}
