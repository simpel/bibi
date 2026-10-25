import { STORY_DAY } from "./calendar-dates";
import { toMinutes } from "./calendar-time";
import type { AssetBooking, CalendarState, Money } from "./calendar-types";
import { CLIENT_CONTACTS } from "./client-contacts-data";
import { PEOPLE } from "./people-data";
import { STATES } from "./states-data";

export type BusyRow = {
  a: string;
  /** Ticket number, or none for an internal block. */
  t?: number;
  c?: string;
  n: string;
  s: string;
  e: string;
  st: keyof typeof STATES;
  su?: number;
  td?: number;
  /** Staff notes on the line. */
  no?: string;
};

/** Who owns each ticket: Erik sells, Johan coordinates the rest. */
const ERIK_TICKETS = new Set([19, 21, 25, 41, 43, 44, 47]);

/** Guests per ticket on the busy day. */
const HEADCOUNT: Record<number, number> = {
  18: 24,
  19: 120,
  21: 18,
  22: 15,
  25: 22,
  26: 20,
  31: 14,
  33: 16,
  41: 10,
  43: 6,
  44: 6,
  45: 8,
  46: 9,
  47: 38,
  48: 60,
  49: 70,
  50: 280,
};

/** A rough line total for the story: SEK 1 200 per booked hour, rounded to hundreds. */
export const storyValue = ({ start, end }: { start: string; end: string }): Money => {
  const hours = (toMinutes({ time: end }) - toMinutes({ time: start })) / 60;
  return { amount: Math.round((hours * 1200) / 100) * 100, currency: "SEK" };
};

const contactOf = ({ ticket }: { ticket?: number }) =>
  ticket
    ? { person: ERIK_TICKETS.has(ticket) ? PEOPLE.erik : PEOPLE.johan, via: "Ticket assignee" }
    : undefined;

export const C = {
  volvo: "Volvo Cars",
  vgr: "Västra Götalandsregionen",
  hisingen: "Hisingen Energi AB",
  chalmers: "Chalmers tekniska högskola",
  stad: "Göteborgs Stad",
  massan: "Svenska Mässan Gothenburg Convention Centre",
  ericsson: "Ericsson",
  sca: "SCA Hygiene Products",
};

const state = ({ key }: { key: keyof typeof STATES }): CalendarState => STATES[key];

export const toBookings = ({ rows, prefix }: { rows: readonly BusyRow[]; prefix: string }) =>
  rows.map(
    (row, index): AssetBooking => ({
      id: `${prefix}-${index}`,
      name: row.n,
      type: row.n,
      place: null,
      start: row.s,
      end: row.e,
      setupMinutes: row.su ?? 0,
      teardownMinutes: row.td ?? 0,
      state: state({ key: row.st }),
      quantity: 1,
      assetId: row.a,
      date: STORY_DAY,
      ticket: row.t ? `Ticket ${row.t}` : null,
      customer: row.c ?? null,
      client: row.c ? CLIENT_CONTACTS[row.c] : undefined,
      value: row.t ? storyValue({ start: row.s, end: row.e }) : undefined,
      headcount: row.t ? HEADCOUNT[row.t] : undefined,
      contact: contactOf({ ticket: row.t }),
      notes: row.no,
    }),
  );
