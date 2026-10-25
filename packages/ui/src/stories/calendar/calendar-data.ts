import type {
  CalendarLine,
  CalendarTicket,
} from "../../components/availability-calendar/calendar-types";
import { PEOPLE } from "./people-data";
import { STATES } from "./states-data";

const day: CalendarLine = {
  id: "day",
  name: "Conference day",
  type: "Package",
  place: null,
  start: "09:00",
  end: "17:00",
  setupMinutes: 0,
  teardownMinutes: 0,
  state: STATES.active,
  quantity: 24,
};

type PartInput = Omit<CalendarLine, "parentId" | "quantity">;

const part = ({ ...line }: PartInput): CalendarLine => ({
  ...line,
  quantity: 24,
  parentId: day.id,
  href: `#line-${line.id}`,
});

/** Ticket 18 in the Lindholmen demo, with the buffers and staffing ADR 0059 adds. */
export const TICKET_18: CalendarTicket = {
  reference: "Ticket 18",
  customer: "Hisingen Energi AB",
  purpose: "Sales conference",
  date: "2026-11-12",
  headcount: 24,
  contact: { person: PEOPLE.johan, via: "Ticket assignee" },
  lines: [
    day,
    part({
      id: "room",
      name: "Vrångö",
      type: "Room",
      place: "Vrångö",
      start: "09:00",
      end: "17:00",
      setupMinutes: 45,
      teardownMinutes: 30,
      state: STATES.prebooked,
      contact: { person: PEOPLE.johan, via: "Coordinator" },
      guests: true,
      notes: "U-shape for 24. Customer brings their own clicker; HDMI on the lectern.",
    }),
    part({
      id: "tech",
      name: "AV technician",
      type: "Staff",
      place: "Vrångö",
      start: "08:15",
      end: "09:30",
      setupMinutes: 0,
      teardownMinutes: 0,
      state: STATES.prebooked,
      internalOnly: true,
      contact: { person: PEOPLE.sara, via: "Assignee" },
      notes: "Test the hybrid link with the customer's IT before 09:00.",
    }),
    part({
      id: "break",
      name: "Morning break",
      type: "Food & drink",
      place: "Vrångö",
      start: "10:30",
      end: "11:00",
      setupMinutes: 15,
      teardownMinutes: 15,
      state: STATES.estimated,
      contact: { person: PEOPLE.ali, via: "Head of kitchen" },
      guests: true,
    }),
    part({
      id: "lunch",
      name: "Conference lunch",
      type: "Food & drink",
      place: "Restaurant",
      start: "12:30",
      end: "13:30",
      setupMinutes: 30,
      teardownMinutes: 30,
      state: STATES.estimated,
      contact: { person: PEOPLE.ali, via: "Head of kitchen" },
      staff: [PEOPLE.mona, PEOPLE.leo],
      guests: true,
      notes: "Window tables. 3 vegetarian, 1 gluten-free: see the kitchen sheet.",
    }),
  ],
};
