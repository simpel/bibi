import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";
import { loadZoneOfVenue } from "../../shared/time-zones";
import { toDateColumn } from "../../time/date-column";
import { type PlainDate, toIsoDate } from "../../time/plain-date";
import { toServiceDto } from "../dining-service/service-rows";
import type { DayOverride, SittingRule, WindowRule } from "./slots";

type Ctx = { context: Pick<OperationContext, "db"> };

/** A sitting with everything availability reads from it. */
export type Sitting = SittingRule &
  WindowRule & {
    name: string;
    changeCutoffMinutes: number;
    depositFromParty: number | null;
    depositPerCoverMinor: number | null;
  };

/** What a dining room says about bookable time on one local date (ADR 0119). */
export type RoomDay = {
  roomItemId: string;
  timeZone: string;
  openDaysAhead: number | null;
  openFrom: Date | null;
  openUntil: Date | null;
  sittings: readonly Sitting[];
  overrides: ReadonlyMap<string, DayOverride>;
  /** The venue or the room is closed all day (an hours exception without times). */
  closed: boolean;
};

/** The room's zone, dining settings and active sittings, or NOT_FOUND / VALIDATION. */
export async function loadRoom({ context, roomItemId }: Ctx & { roomItemId: string }) {
  const [item, zoneOf] = await Promise.all([
    context.db.item.findFirst({
      where: { id: roomItemId },
      select: { venueId: true, venue: { select: { timeZone: true } }, diningRoom: true },
    }),
    loadZoneOfVenue({ context }),
  ]);
  if (!item) return notFound({ entity: "Item" });
  if (item.diningRoom?.status !== "ACTIVE") {
    const message = "The room is not set up for table booking (diningRoom.set)";
    return invalid({ message, issues: [{ path: "roomItemId", message }] });
  }
  const rows = await context.db.diningService.findMany({ where: { roomItemId } });
  const sittings: Sitting[] = rows.map((row) => {
    const dto = toServiceDto({ row });
    return { ...dto, weekdays: dto.weekdays, turnTimes: dto.turnTimes };
  });
  return ok({
    value: {
      venueId: item.venueId,
      timeZone: zoneOf({ venue: item.venue }),
      openDaysAhead: item.diningRoom?.openDaysAhead ?? null,
      openFrom: item.diningRoom?.openFrom ?? null,
      openUntil: item.diningRoom?.openUntil ?? null,
      sittings,
    },
  });
}

export type LoadRoomDayInput = Ctx & { roomItemId: string; date: PlainDate };

/** The room's sittings, the date's exceptions and whether the venue or room is closed that day. */
export async function loadRoomDay({
  context,
  roomItemId,
  date,
}: LoadRoomDayInput): Promise<Result<RoomDay>> {
  const room = await loadRoom({ context, roomItemId });
  if (!room.ok) return room;
  const { venueId, timeZone, openDaysAhead, openFrom, openUntil, sittings } = room.value;
  const day = toDateColumn({ date: toIsoDate({ date }) });
  const [exceptions, closures] = await Promise.all([
    context.db.diningServiceException.findMany({
      where: { date: day, serviceId: { in: sittings.map((sitting) => sitting.id) } },
    }),
    context.db.hoursException.count({
      where: {
        date: day,
        startMinute: null,
        OR: [{ itemId: roomItemId }, ...(venueId ? [{ venueId }] : [])],
      },
    }),
  ]);
  const overrides = new Map(exceptions.map((row) => [row.serviceId, row]));
  return ok({
    value: {
      ...{ roomItemId, timeZone, openDaysAhead, openFrom, openUntil, sittings, overrides },
      closed: closures > 0,
    },
  });
}
