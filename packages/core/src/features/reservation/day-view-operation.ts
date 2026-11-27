import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { runNested } from "../../operations/run-nested";
import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { loadZoneOfVenue } from "../../shared/time-zones";
import { addDays, parseIsoDate, toIsoDate, weekdayOf } from "../../time/plain-date";
import { fromZonedParts } from "../../time/zoned-time";
import { readLayout } from "../floor-plan/layout-read";
import { listTableBlocks } from "../table-block/operations";
import {
  type ReservationDayView,
  ReservationDayViewInputSchema,
  ReservationDayViewSchema,
} from "./day-view-schema";
import { listReservations } from "./read-operations";
import { loadRoomDay } from "./room-day";

type Ctx = { context: OperationContext };

const midnight = ({ iso, timeZone }: { iso: string; timeZone: string }) =>
  fromZonedParts({
    date: parseIsoDate({ value: iso }),
    time: { hour: 0, minute: 0, second: 0 },
    timeZone,
  });

/** The organization's dining rooms with their zones and (with item:read) names, by name. */
async function loadRooms({ context }: Ctx) {
  const [rows, zoneOf] = await Promise.all([
    context.db.diningRoom.findMany({
      select: {
        itemId: true,
        slug: true,
        item: { select: { name: true, venue: { select: { timeZone: true } } } },
      },
    }),
    loadZoneOfVenue({ context }),
  ]);
  const named = canView({ context, feature: "item" });
  return rows
    .map((row) => ({
      itemId: row.itemId,
      name: named ? row.item.name : null,
      slug: row.slug,
      timeZone: zoneOf({ venue: row.item.venue }),
    }))
    .sort((a, b) => (a.name ?? a.slug).localeCompare(b.name ?? b.slug));
}

/** The lists' values as "List: Value", for the needs editor (configuration:read). */
async function loadNeedOptions({ context }: Ctx) {
  if (!canView({ context, feature: "configuration" })) return [];
  const lists = await context.db.vocabulary.findMany({
    select: {
      name: true,
      values: {
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
  return lists.flatMap((list) =>
    list.values.map((value) => ({ id: value.id, name: `${list.name}: ${value.name}` })),
  );
}

const EMPTY_LIST = { items: [], totals: { reservations: 0, covers: 0, needs: [] } };

export const viewReservationDay = defineOperation({
  name: "reservation.dayView",
  kind: "query",
  description:
    "The Reservations screen for one room and local date in one read (ADR 0119): rooms to pick " +
    "from, the day's sittings with that day's exceptions applied, their layouts (tables), the " +
    "reservations with totals, table blocks and the need options.",
  input: ReservationDayViewInputSchema,
  output: ReservationDayViewSchema,
  permission: "reservation:read",
  handler: async ({ input, context }) => {
    const rooms = await loadRooms({ context });
    const chosen = rooms.find((room) => room.itemId === input.roomItemId) ?? rooms[0];
    const empty: ReservationDayView = {
      rooms,
      room: null,
      sittings: [],
      layouts: [],
      reservations: EMPTY_LIST,
      blocks: [],
      needOptions: [],
    };
    if (!chosen) return ok({ value: empty });
    const { timeZone } = chosen;
    const date = parseIsoDate({ value: input.date });
    const from = midnight({ iso: input.date, timeZone });
    const to = midnight({ iso: toIsoDate({ date: addDays({ date, days: 1 }) }), timeZone });
    const day = await loadRoomDay({ context, roomItemId: chosen.itemId, date });
    const sittings = day.ok
      ? day.value.sittings.map((sitting) => {
          const override = day.value.overrides.get(sitting.id);
          return {
            id: sitting.id,
            name: sitting.name,
            layoutId: override?.layoutId ?? sitting.layoutId,
            firstStartMinute: override?.firstStartMinute ?? sitting.firstStartMinute,
            lastStartMinute: override?.lastStartMinute ?? sitting.lastStartMinute,
            slotMinutes: sitting.slotMinutes,
            maxCoversPerSlot: override?.maxCoversPerSlot ?? sitting.maxCoversPerSlot,
            closed:
              day.value.closed ||
              Boolean(override?.closed) ||
              !sitting.weekdays.includes(weekdayOf({ date })),
          };
        })
      : [];
    const layoutIds = [...new Set(sittings.map((sitting) => sitting.layoutId))];
    const span = { roomItemId: chosen.itemId, from, to };
    const [layouts, reservations, blocks, needOptions] = await Promise.all([
      canView({ context, feature: "item" })
        ? Promise.all(layoutIds.map((id) => readLayout({ context, id })))
        : Promise.resolve([]),
      runNested({ operation: listReservations, input: span, context }),
      runNested({ operation: listTableBlocks, input: { from, to }, context }),
      loadNeedOptions({ context }),
    ]);
    const shown = layouts.flatMap((layout) => (layout.ok ? [layout.value] : []));
    const tableIds = new Set(shown.flatMap((layout) => layout.elements.map((piece) => piece.id)));
    return ok({
      value: {
        rooms,
        room: { itemId: chosen.itemId, timeZone, from, to },
        sittings,
        layouts: shown,
        reservations: reservations.ok ? reservations.value : EMPTY_LIST,
        blocks: blocks.ok
          ? blocks.value.items.filter((block) => tableIds.has(block.elementId))
          : [],
        needOptions,
      },
    });
  },
});
