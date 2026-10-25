import { storyValue } from "./busy-row";
import { TICKET_18 } from "./calendar-data";
import { STORY_DAY } from "./calendar-dates";
import type { AssetBooking, CalendarAsset, CalendarLine } from "./calendar-types";
import { CLIENT_CONTACTS } from "./client-contacts-data";
import { PEOPLE } from "./people-data";
import { STATES } from "./states-data";

const space = ({ id, name, detail }: { id: string; name: string; detail?: string }) => ({
  id,
  name,
  detail,
  group: "Spaces",
});

/** 12 Nov at Lindholmen: a quiet day, spaces and two staff. */
export const ASSETS: readonly CalendarAsset[] = [
  space({ id: "aspero", name: "Asperö", detail: "12 seats" }),
  space({ id: "branno", name: "Brännö", detail: "20 seats" }),
  space({ id: "vinga", name: "Vinga", detail: "Auditorium, 120" }),
  space({ id: "vrango", name: "Vrångö", detail: "30 seats" }),
  space({ id: "restaurant", name: "Restaurant", detail: "80 covers" }),
  ...[PEOPLE.sara, PEOPLE.mona].map((person) => ({
    id: person.id,
    name: person.name,
    detail: person.role,
    group: "Staff",
    person,
  })),
];

const t18 = {
  ticket: TICKET_18.reference,
  customer: TICKET_18.customer,
  headcount: TICKET_18.headcount,
};
const erik = { person: PEOPLE.erik, via: "Ticket assignee" };
const lineOf = ({ id }: { id: string }) => TICKET_18.lines.find((line) => line.id === id);
const on = ({ line, assetId }: { line?: CalendarLine; assetId: string }) =>
  line ? [{ ...line, ...t18, assetId }] : [];

const base = { type: "Room", place: null, setupMinutes: 0, teardownMinutes: 0, quantity: 20 };

const withClients = ({ bookings }: { bookings: readonly Omit<AssetBooking, "date">[] }) =>
  bookings.map((booking) => ({
    ...booking,
    date: STORY_DAY,
    client: booking.customer ? CLIENT_CONTACTS[booking.customer] : undefined,
    value: booking.customer ? storyValue(booking) : undefined,
  }));

export const BOOKINGS: readonly AssetBooking[] = withClients({
  bookings: [
    ...on({ line: lineOf({ id: "room" }), assetId: "vrango" }),
    ...on({ line: lineOf({ id: "lunch" }), assetId: "restaurant" }),
    ...on({ line: lineOf({ id: "tech" }), assetId: "sara" }),
    ...on({ line: lineOf({ id: "lunch" }), assetId: "mona" }).map((line) => ({
      ...line,
      id: "t18-mona",
    })),
    {
      ...base,
      id: "t21",
      name: "Brännö",
      start: "08:00",
      end: "12:00",
      teardownMinutes: 30,
      state: STATES.booked,
      assetId: "branno",
      ticket: "Ticket 21",
      customer: "Volvo Cars",
      contact: erik,
      headcount: 18,
    },
    {
      ...base,
      id: "t22",
      name: "Brännö",
      start: "13:00",
      end: "16:00",
      setupMinutes: 30,
      state: STATES.prebooked,
      assetId: "branno",
      ticket: "Ticket 22",
      customer: "Göteborgs Stad",
      contact: erik,
      headcount: 18,
    },
    {
      ...base,
      id: "t19",
      name: "Vinga",
      start: "10:00",
      end: "15:30",
      setupMinutes: 60,
      teardownMinutes: 45,
      state: STATES.booked,
      assetId: "vinga",
      ticket: "Ticket 19",
      customer: "Chalmers",
      contact: erik,
      headcount: 120,
    },
    {
      ...base,
      id: "t19-tech",
      name: "AV technician",
      type: "Staff",
      start: "09:45",
      end: "15:30",
      state: STATES.booked,
      assetId: "sara",
      ticket: "Ticket 19",
      customer: "Chalmers",
      contact: erik,
    },
    {
      ...base,
      id: "maint",
      name: "Maintenance",
      start: "07:00",
      end: "09:00",
      state: STATES.maintenance,
      assetId: "aspero",
      ticket: null,
      customer: null,
    },
  ],
});
