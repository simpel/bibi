import "server-only";
import { effectiveTimeZone, fromZonedParts, parseIsoDate } from "@bibi/core/schemas";
import { getDateTimeFormat } from "@/server/date-time-format";
import { parseDay, parseParty } from "../lib/booking-query";
import { groupSlots, type SlotGroup } from "../lib/group-slots";
import { todayIn } from "../lib/today-in";
import type { GuestPin } from "./guest-pin";
import { loadSlots } from "./load-guest-booking";

export type PrepareSlotsInput = {
  pin: GuestPin;
  slug: string;
  roomSlug: string;
  maxParty: number;
  /** The raw `?party=` and `?date=`. */
  partyParam: string | undefined;
  dateParam: string | undefined;
  /** The manage token of a booking being moved. */
  token?: string;
};

export type PreparedSlots = {
  party: number;
  day: string;
  today: string;
  dayLabel: string;
  groups: SlotGroup[];
};

const NOON = { hour: 12, minute: 0, second: 0 };

/**
 * The time step of a booking, ready to render (ADR 0119): the party and day from the URL, the
 * day's free times per sitting written in the room's zone. The zone comes with the first answer;
 * when "today" there is later than guessed, the day is read again. Null for an unknown room.
 */
export async function prepareSlots({
  pin,
  slug,
  roomSlug,
  maxParty,
  partyParam,
  dateParam,
  token,
}: PrepareSlotsInput): Promise<PreparedSlots | null> {
  const party = parseParty({ value: partyParam, max: maxParty });
  const now = new Date();
  const guessed = todayIn({ timeZone: effectiveTimeZone({}), now });
  let day = parseDay({ value: dateParam, today: guessed });
  let answer = await loadSlots({ pin, slug, roomSlug, date: day, partySize: party, token });
  if (!answer) return null;
  const today = todayIn({ timeZone: answer.timeZone, now });
  if (day < today) {
    day = today;
    answer = await loadSlots({ pin, slug, roomSlug, date: day, partySize: party, token });
    if (!answer) return null;
  }
  const { timeZone, slots } = answer;
  const dates = await getDateTimeFormat();
  const midday = fromZonedParts({ date: parseIsoDate({ value: day }), time: NOON, timeZone });
  return {
    party,
    day,
    today,
    dayLabel: dates.date({ instant: midday, timeZone, weekday: "long", year: false }),
    groups: groupSlots({ slots, formatTime: ({ instant }) => dates.time({ instant, timeZone }) }),
  };
}
