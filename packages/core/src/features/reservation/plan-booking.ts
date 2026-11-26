import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";
import { toZonedParts } from "../../time/zoned-time";
import { type BusySpan, pickTables } from "./assign";
import { loadBusy, loadCovers, loadLayoutTables, loadRoomHolds, touches } from "./busy";
import { loadRoom, loadRoomDay } from "./room-day";
import type { ReservationWarning } from "./schema";
import { candidateStarts } from "./slots";

const MINUTE_MS = 60_000;
const DEFAULT_MINUTES = 120;

export type PlanBookingInput = {
  context: Pick<OperationContext, "db">;
  roomItemId: string;
  startsAt: Date;
  partySize: number;
  durationMinutes?: number;
  tableIds?: readonly string[];
  /** A reservation being changed: its own holds and covers do not count. */
  except?: string;
};

export type BookingPlan = {
  serviceId: string | null;
  endsAt: Date;
  tableIds: string[];
  warnings: ReservationWarning[];
};

/** The sitting whose starts include this one, with its layout and turn time for the party. */
async function matchSitting({ context, roomItemId, startsAt, partySize }: PlanBookingInput) {
  const zone = await loadRoom({ context, roomItemId });
  if (!zone.ok) return zone;
  const date = toZonedParts({ instant: startsAt, timeZone: zone.value.timeZone }).date;
  const day = await loadRoomDay({ context, roomItemId, date });
  if (!day.ok) return day;
  for (const sitting of day.value.sittings) {
    const override = day.value.overrides.get(sitting.id) ?? null;
    const starts = day.value.closed
      ? []
      : candidateStarts({ date, timeZone: day.value.timeZone, sitting, override, partySize });
    const hit = starts.find((start) => start.startsAt.getTime() === startsAt.getTime());
    if (hit) return ok({ value: { day: day.value, sitting, candidate: hit } });
  }
  return ok({ value: { day: day.value, sitting: null, candidate: null } });
}

const labelsOf = ({
  ids,
  labels,
}: {
  ids: readonly string[];
  labels: Map<string, string | null>;
}) => ids.map((id) => labels.get(id) ?? "?").join(", ");

/**
 * Where and how long a staff booking goes (ADR 0119): the matching sitting's layout and turn time,
 * the tables asked for or the smallest free fit. A hard hold on the room or a taken table is
 * CONFLICT; a start outside every sitting, over the pace or over a soft hold is a warning.
 */
export async function planBooking({ ...input }: PlanBookingInput): Promise<Result<BookingPlan>> {
  const { context, roomItemId, startsAt, partySize, durationMinutes, except } = input;
  const matched = await matchSitting(input);
  if (!matched.ok) return matched;
  const { day, sitting, candidate } = matched.value;
  const fallback = sitting ?? day.sittings[0];
  if (!fallback) {
    const message = "The room has no sitting, so it has no tables to book";
    return invalid({ message, issues: [{ path: "roomItemId", message }] });
  }
  const layoutId = candidate?.layoutId ?? fallback.layoutId;
  const endsAt = durationMinutes
    ? new Date(startsAt.getTime() + durationMinutes * MINUTE_MS)
    : (candidate?.endsAt ?? new Date(startsAt.getTime() + DEFAULT_MINUTES * MINUTE_MS));
  const span = { startsAt, endsAt };
  const layout = await loadLayoutTables({ context, layoutId });
  const labels = new Map(layout.tables.map((table) => [table.id, table.label]));
  const [holds, busy] = await Promise.all([
    loadRoomHolds({ context, roomItemId, ...span }),
    loadBusy({ context, elementIds: [...labels.keys()], ...span, except }),
  ]);
  if (touches({ spans: holds.hard, ...span }))
    return conflict({ message: "The whole room is booked or blocked at that time" });
  const tables = await chooseTables({ ...input, layout, busy, labels, endsAt });
  if (!tables.ok) return tables;
  const warnings: ReservationWarning[] = [];
  if (!sitting) warnings.push("OUTSIDE_SITTING");
  if (touches({ spans: holds.soft, ...span })) warnings.push("ROOM_SOFT_HELD");
  if (sitting && candidate?.maxCoversPerSlot) {
    const slotEnd = new Date(startsAt.getTime() + sitting.slotMinutes * MINUTE_MS);
    const covers = await loadCovers({ context, roomItemId, startsAt, endsAt: slotEnd, except });
    const taken = covers.reduce((sum, row) => sum + row.partySize, 0);
    if (taken + partySize > candidate.maxCoversPerSlot) warnings.push("OVER_PACE");
  }
  return ok({
    value: { serviceId: sitting?.id ?? null, endsAt, tableIds: tables.value, warnings },
  });
}

type ChooseInput = PlanBookingInput & {
  layout: Awaited<ReturnType<typeof loadLayoutTables>>;
  busy: Map<string, BusySpan[]>;
  labels: Map<string, string | null>;
  endsAt: Date;
};

/** The tables asked for (each a free table of the layout), else the smallest free fit for staff. */
async function chooseTables({ ...input }: ChooseInput): Promise<Result<string[]>> {
  const { tableIds, layout, busy, labels, startsAt, endsAt, partySize } = input;
  if (tableIds) {
    const unknown = tableIds.filter((id) => !labels.has(id));
    if (unknown.length > 0) {
      const message = "Not a table of the sitting's layout";
      return invalid({ message, issues: [{ path: "tableIds", message }] });
    }
    // Staff may book over an online-only block; the write splits it.
    const taken = tableIds.filter((id) =>
      (busy.get(id) ?? []).some(
        (span) => span.kind !== "ONLINE_ONLY" && span.startsAt < endsAt && startsAt < span.endsAt,
      ),
    );
    if (taken.length > 0)
      return conflict({
        message: `Table ${labelsOf({ ids: taken, labels })} is taken or blocked at that time`,
        issues: taken.map((id) => ({ path: `tableIds.${id}`, message: "Taken or blocked" })),
      });
    return ok({ value: [...tableIds] });
  }
  const picked = pickTables({ ...layout, busy, partySize, startsAt, endsAt, online: false });
  return picked
    ? ok({ value: picked })
    : conflict({ message: `No free table or combination fits ${partySize} people then` });
}
