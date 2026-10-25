import type { CalendarLine, CalendarTicket } from "./calendar-types";
import { PEOPLE } from "./people-data";
import { STATES } from "./states-data";

const base: Omit<CalendarLine, "id" | "name" | "type" | "place" | "start" | "end" | "state"> = {
  setupMinutes: 0,
  teardownMinutes: 0,
  quantity: 8,
};

/** A smaller ticket with no buffers: shows that the components hold up with less. */
export const TICKET_SMALL: CalendarTicket = {
  reference: "Ticket 24",
  customer: "Göta Design",
  purpose: "Board meeting",
  date: "2026-11-19",
  headcount: 8,
  /** No line has its own contact here, so every line falls back to Erik. */
  contact: { person: PEOPLE.erik, via: "Ticket assignee" },
  lines: [
    {
      ...base,
      id: "meet",
      name: "Meeting room",
      type: "Room",
      place: "Brännö",
      start: "13:00",
      end: "16:00",
      state: STATES.booked,
      guests: true,
    },
    {
      ...base,
      id: "fika",
      name: "Afternoon fika",
      type: "Food & drink",
      place: "Brännö",
      start: "14:30",
      end: "15:00",
      state: STATES.booked,
      guests: true,
    },
  ],
};
