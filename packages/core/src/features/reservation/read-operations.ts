import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { parseIsoDate } from "../../time/plain-date";
import { evaluateDay } from "./evaluate";
import { loadRoomDay } from "./room-day";
import {
  ReservationAvailabilityInputSchema,
  ReservationAvailabilityOutputSchema,
  type ReservationDto,
  ReservationIdInputSchema,
  ReservationListInputSchema,
  ReservationListOutputSchema,
  ReservationSchema,
} from "./schema";
import { loadReservation, RESERVATION_INCLUDE, toReservationDto } from "./to-dto";

const COVER_STATES = new Set(["BOOKED", "SEATED", "COMPLETED"]);

/** Reservations, covers and summed needs for a list (the day view's header). */
function totalsOf({ items }: { items: readonly ReservationDto[] }) {
  const counted = items.filter((item) => COVER_STATES.has(item.state));
  const needs = new Map<string, number>();
  for (const item of counted)
    for (const row of item.requirements)
      needs.set(row.vocabularyValueId, (needs.get(row.vocabularyValueId) ?? 0) + row.quantity);
  return {
    reservations: counted.length,
    covers: counted.reduce((sum, item) => sum + item.partySize, 0),
    needs: [...needs].map(([vocabularyValueId, quantity]) => ({ vocabularyValueId, quantity })),
  };
}

export const listReservations = defineOperation({
  name: "reservation.list",
  kind: "query",
  description:
    "Table reservations starting in a period (ADR 0119), by start time, with their tables and " +
    "needs, plus totals: reservations, covers and summed needs (e.g. Gluten 5). Default leaves " +
    "out cancelled ones. Answers 'how many covers tonight, any allergies?' in one call.",
  input: ReservationListInputSchema,
  output: ReservationListOutputSchema,
  permission: "reservation:read",
  handler: async ({ input, context }) => {
    const states = input.states ?? ["PENDING_PAYMENT", "BOOKED", "SEATED", "COMPLETED", "NO_SHOW"];
    const rows = await context.db.reservation.findMany({
      where: {
        ...(input.roomItemId ? { roomItemId: input.roomItemId } : {}),
        startsAt: { gte: input.from, lt: input.to },
        state: { in: states },
      },
      include: RESERVATION_INCLUDE,
      orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }],
      take: 1000,
    });
    const items = rows.map((row) => toReservationDto({ row }));
    return ok({ value: { items, totals: totalsOf({ items }) } });
  },
});

export const getReservation = defineOperation({
  name: "reservation.get",
  kind: "query",
  description: "One table reservation with its tables, booker, needs and history times.",
  input: ReservationIdInputSchema,
  output: ReservationSchema,
  permission: "reservation:read",
  handler: async ({ input, context }) => {
    const found = await loadReservation({ context, id: input.id });
    return found ? ok({ value: found }) : notFound({ entity: "Reservation" });
  },
});

export const reservationAvailability = defineOperation({
  name: "reservation.availability",
  kind: "query",
  description:
    "Free start times in a dining room on a local date for a party (ADR 0119): each sitting's " +
    "slots with the tables it would get, the people already starting then and warnings " +
    "(OVER_PACE, ROOM_SOFT_HELD, OUTSIDE_ONLINE_WINDOW). online: true applies the guest rules. " +
    "Answers 'is there room for 6 on Saturday at 19:00?'.",
  input: ReservationAvailabilityInputSchema,
  output: ReservationAvailabilityOutputSchema,
  permission: "reservation:read",
  handler: async ({ input, context }) => {
    const date = parseIsoDate({ value: input.date });
    const day = await loadRoomDay({ context, roomItemId: input.roomItemId, date });
    if (!day.ok) return day;
    const slots = await evaluateDay({
      ...{ context, day: day.value, date, partySize: input.partySize, online: input.online },
      now: nowOf({ context }),
    });
    return ok({ value: { timeZone: day.value.timeZone, slots } });
  },
});
