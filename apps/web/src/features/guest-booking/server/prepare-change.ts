import "server-only";
import type { PublicBookingPageDto, PublicReservationDto } from "@bibi/core/schemas";
import { todayIn } from "../lib/today-in";
import { type PreparedSlots, prepareSlots } from "./prepare-slots";

export type PrepareChangeInput = {
  token: string;
  reservation: PublicReservationDto;
  page: PublicBookingPageDto | null;
  query: { party?: string; date?: string };
};

/**
 * The manage page's change step: the reservation's own room, starting from its party and day
 * until the guest picks others. Null when it may not change or its room is no longer online.
 */
export async function prepareChange({
  token,
  reservation,
  page,
  query,
}: PrepareChangeInput): Promise<(PreparedSlots & { maxParty: number }) | null> {
  const { pageSlug, roomSlug } = reservation;
  const room = page?.rooms.find((candidate) => candidate.slug === roomSlug);
  if (!reservation.canChange || !pageSlug || !roomSlug || !room) return null;
  const ownDay = todayIn({ timeZone: reservation.timeZone, now: reservation.startsAt });
  const slots = await prepareSlots({
    ...{ pin: { token }, slug: pageSlug, roomSlug, maxParty: room.maxOnlineParty },
    partyParam: query.party ?? String(reservation.partySize),
    dateParam: query.date ?? ownDay,
    token,
  });
  return slots ? { ...slots, maxParty: room.maxOnlineParty } : null;
}
