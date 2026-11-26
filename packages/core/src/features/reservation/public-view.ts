import type { OperationContext } from "../../operations/types";
import { nowOf } from "../../time/now";
import { FALLBACK_TIME_ZONE } from "../../time/time-zone";
import type { PublicReservationDto } from "./public-schema";
import { loadRoom } from "./room-day";

type Ctx = { context: Pick<OperationContext, "db" | "now"> };

const MINUTE_MS = 60_000;

/** Until when the guest may change or cancel: the sitting's cutoff before the start; null = never online. */
export async function changeUntil({
  context,
  serviceId,
  startsAt,
}: Ctx & { serviceId: string | null; startsAt: Date }): Promise<Date | null> {
  if (!serviceId) return null;
  const service = await context.db.diningService.findFirst({
    where: { id: serviceId, status: { in: ["ACTIVE", "ARCHIVED"] } },
    select: { changeCutoffMinutes: true },
  });
  return service ? new Date(startsAt.getTime() - service.changeCutoffMinutes * MINUTE_MS) : null;
}

/** The guest's view of a reservation by its manage token, or null. */
export async function publicView({ context, token }: Ctx & { token: string }): Promise<{
  id: string;
  roomItemId: string;
  view: PublicReservationDto;
} | null> {
  const row = await context.db.reservation.findFirst({
    where: { publicToken: token },
    include: { room: { select: { name: true, diningRoom: { select: { slug: true } } } } },
  });
  if (!row) return null;
  const [until, room, page] = await Promise.all([
    changeUntil({ context, serviceId: row.serviceId, startsAt: row.startsAt }),
    loadRoom({ context, roomItemId: row.roomItemId }),
    context.db.bookingPage.findFirst({ select: { slug: true } }),
  ]);
  const open = row.state === "BOOKED" && until !== null && nowOf({ context }) < until;
  return {
    id: row.id,
    roomItemId: row.roomItemId,
    view: {
      roomName: row.room.name,
      pageSlug: page?.slug ?? null,
      roomSlug: row.room.diningRoom?.slug ?? null,
      ...{ startsAt: row.startsAt, endsAt: row.endsAt, partySize: row.partySize, state: row.state },
      timeZone: room.ok ? room.value.timeZone : FALLBACK_TIME_ZONE,
      ...{ bookerName: row.bookerName, bookerPhone: row.bookerPhone, bookerEmail: row.bookerEmail },
      note: row.note,
      canChange: open,
      changeUntil: until,
    },
  };
}
