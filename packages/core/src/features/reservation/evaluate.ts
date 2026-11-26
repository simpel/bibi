import type { OperationContext } from "../../operations/types";
import type { PlainDate } from "../../time/plain-date";
import { pickTables } from "./assign";
import {
  type LayoutTables,
  loadBusy,
  loadCovers,
  loadLayoutTables,
  loadRoomHolds,
  touches,
} from "./busy";
import type { RoomDay, Sitting } from "./room-day";
import type { AvailabilitySlot, ReservationWarning } from "./schema";
import { type Candidate, candidateStarts, inOnlineWindow } from "./slots";

type Ctx = { context: Pick<OperationContext, "db"> };

export type EvaluateDayInput = Ctx & {
  day: RoomDay;
  date: PlainDate;
  partySize: number;
  online: boolean;
  now: Date;
  /** A reservation being changed: its own holds and covers do not count. */
  except?: string;
};

type Slot = { candidate: Candidate; sitting: Sitting };

/** Every start the day's sittings offer for the party, in time order. */
function daySlots({ day, date, partySize }: Pick<EvaluateDayInput, "day" | "date" | "partySize">) {
  if (day.closed) return [];
  return day.sittings
    .flatMap((sitting) =>
      candidateStarts({
        ...{ date, timeZone: day.timeZone, sitting, partySize },
        override: day.overrides.get(sitting.id) ?? null,
      }).map((candidate) => ({ candidate, sitting })),
    )
    .sort((a, b) => a.candidate.startsAt.getTime() - b.candidate.startsAt.getTime());
}

/** The layouts the slots use, each loaded once. */
async function layoutsOf({ context, slots }: Ctx & { slots: readonly Slot[] }) {
  const ids = [...new Set(slots.map((slot) => slot.candidate.layoutId))];
  const loaded = await Promise.all(ids.map((layoutId) => loadLayoutTables({ context, layoutId })));
  return new Map<string, LayoutTables>(ids.map((id, i) => [id, loaded[i] as LayoutTables]));
}

/**
 * The day's bookable starts for a party (ADR 0119), each with the tables it would get and why it
 * needs a second look. A hard hold on the room refuses a start; pace, soft holds and (for guests)
 * the online window are warnings that make it unavailable online but not for staff.
 */
export async function evaluateDay({
  context,
  day,
  date,
  partySize,
  online,
  now,
  except,
}: EvaluateDayInput): Promise<AvailabilitySlot[]> {
  const slots = daySlots({ day, date, partySize });
  const first = slots[0];
  const last = slots.at(-1);
  if (!first || !last) return [];
  const span = { startsAt: first.candidate.startsAt, endsAt: last.candidate.endsAt };
  const layouts = await layoutsOf({ context, slots });
  const elementIds = [...layouts.values()].flatMap((layout) => layout.tables.map((t) => t.id));
  const [busy, holds, covers] = await Promise.all([
    loadBusy({ context, elementIds, ...span, except }),
    loadRoomHolds({ context, roomItemId: day.roomItemId, ...span }),
    loadCovers({ context, roomItemId: day.roomItemId, ...span, except }),
  ]);
  return slots.map(({ candidate, sitting }) => {
    const { startsAt, endsAt } = candidate;
    const slotEnd = new Date(startsAt.getTime() + sitting.slotMinutes * 60_000);
    const coversInSlot = covers
      .filter((row) => row.startsAt >= startsAt && row.startsAt < slotEnd)
      .reduce((sum, row) => sum + row.partySize, 0);
    const warnings: ReservationWarning[] = [];
    const max = candidate.maxCoversPerSlot;
    if (max !== null && coversInSlot + partySize > max) warnings.push("OVER_PACE");
    if (touches({ spans: holds.soft, startsAt, endsAt })) warnings.push("ROOM_SOFT_HELD");
    const window = { startsAt, now, rule: sitting, openUntil: day.openUntil, partySize };
    if (!inOnlineWindow(window)) warnings.push("OUTSIDE_ONLINE_WINDOW");
    const roomHeld = touches({ spans: holds.hard, startsAt, endsAt });
    const layout = layouts.get(candidate.layoutId);
    const tableIds =
      roomHeld || !layout
        ? null
        : pickTables({ ...layout, busy, partySize, startsAt, endsAt, online });
    const blocked = roomHeld || tableIds === null || (online && warnings.length > 0);
    return {
      ...{ startsAt, endsAt, serviceId: sitting.id, serviceName: sitting.name },
      ...{ available: !blocked, tableIds, warnings, coversInSlot },
    };
  });
}
