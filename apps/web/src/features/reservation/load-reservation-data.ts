import "server-only";
import {
  type DiningRoomDto,
  getLayout,
  type LayoutDto,
  listDiningRooms,
  listItems,
  listReservations,
  listTableBlocks,
  listVocabularies,
  type Result,
} from "@bibi/core";
import { addDays, parseIsoDate, toIsoDate } from "@bibi/core/schemas";
import { cache } from "react";
import { loadSittings } from "@/features/table-booking/load-room-settings";
import { listAll } from "@/server/list-all";
import { runOperation } from "@/server/run-operation";
import { atTime } from "../table-booking/lib/edge-time";
import type { NeedOption } from "./lib/create-form";

export type DiningRoomOption = { itemId: string; name: string; slug: string; timeZone: string };

/** The rooms set up for table booking with their names and zones, once per request. */
export const loadDiningRoomOptions = cache(async (): Promise<Result<DiningRoomOption[]>> => {
  const [rooms, items] = await Promise.all([
    runOperation({ operation: listDiningRooms, input: {} }),
    listAll({ operation: listItems, input: {} }),
  ]);
  if (!rooms.ok) return rooms;
  if (!items.ok) return items;
  const byId = new Map(items.value.map((item) => [item.id, item]));
  const options = rooms.value.items.map((room: DiningRoomDto) => {
    const item = byId.get(room.itemId);
    return {
      itemId: room.itemId,
      name: item?.name ?? room.slug,
      slug: room.slug,
      timeZone: item?.timeZone ?? "UTC",
    };
  });
  return { ok: true, value: options.sort((a, b) => a.name.localeCompare(b.name)) };
});

/** The lists a need is counted against, as "List: Value" options, once per request. */
export const loadNeedOptions = cache(async (): Promise<Result<NeedOption[]>> => {
  const lists = await listAll({ operation: listVocabularies, input: {} });
  if (!lists.ok) return lists;
  const options = lists.value
    .filter((list) => list.status === "ACTIVE")
    .flatMap((list) =>
      list.values.map((value) => ({ id: value.id, name: `${list.name}: ${value.name}` })),
    );
  return { ok: true, value: options };
});

export type DayRangeInput = { date: string; timeZone: string };

/** The instants a local day starts and ends at in a zone: `[from, to)`. */
export function dayRange({ date, timeZone }: DayRangeInput) {
  const next = toIsoDate({ date: addDays({ date: parseIsoDate({ value: date }), days: 1 }) });
  return {
    from: atTime({ day: date, time: "00:00", timeZone }),
    to: atTime({ day: next, time: "00:00", timeZone }),
  };
}

export type LoadDayInput = { roomItemId: string; date: string; timeZone: string };

/** One day's reservations and table blocks of a room. */
export async function loadDay({ roomItemId, date, timeZone }: LoadDayInput) {
  const { from, to } = dayRange({ date, timeZone });
  const [reservations, blocks] = await Promise.all([
    runOperation({ operation: listReservations, input: { roomItemId, from, to } }),
    runOperation({ operation: listTableBlocks, input: { from, to } }),
  ]);
  return { reservations, blocks, from, to };
}

export type RoomTables = {
  sittings: {
    id: string;
    name: string;
    layoutId: string;
    weekdays: number[];
    first: number;
    last: number;
    slot: number;
  }[];
  layouts: LayoutDto[];
};

/** The room's active sittings and the layouts they use (tables, plan) for the floor. */
export async function loadRoomTables({
  roomItemId,
}: {
  roomItemId: string;
}): Promise<Result<RoomTables>> {
  const sittings = await loadSittings({ roomItemId });
  if (!sittings.ok) return sittings;
  const ids = [...new Set(sittings.value.map((sitting) => sitting.layoutId))];
  const layouts = await Promise.all(
    ids.map((id) => runOperation({ operation: getLayout, input: { id } })),
  );
  const failed = layouts.find((layout) => !layout.ok);
  if (failed && !failed.ok) return failed;
  return {
    ok: true,
    value: {
      sittings: sittings.value.map((sitting) => ({
        id: sitting.id,
        name: sitting.name,
        layoutId: sitting.layoutId,
        weekdays: sitting.weekdays,
        first: sitting.firstStartMinute,
        last: sitting.lastStartMinute,
        slot: sitting.slotMinutes,
      })),
      layouts: layouts.flatMap((layout) => (layout.ok ? [layout.value] : [])),
    },
  };
}
