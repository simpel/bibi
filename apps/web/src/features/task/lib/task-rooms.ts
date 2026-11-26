import type { TaskItemHold, TaskItemInput } from "@bibi/core/schemas";
import { fromLocalInputValue, toLocalInputValue } from "../../occupancy/ui/local-date-time";

/** Raw values of one room in a form: times as `YYYY-MM-DDTHH:mm` in the organization's zone. */
export type TaskRoomValues = {
  itemId: string;
  hold: TaskItemHold;
  startsAt: string;
  endsAt: string;
};

/** A room on a task as the detail page prepares it on the server (names and window resolved). */
export type TaskRoomView = {
  /** The `TaskItem` id. */
  id: string;
  itemId: string;
  name: string;
  href: string;
  hold: TaskItemHold;
  startsAt: Date | null;
  endsAt: Date | null;
  /** The window as text, e.g. "Wed 08:00 – Thu 17:00"; null when related. */
  window: string | null;
};

export type DefaultWindowInput = { dueAt: Date | null; timeZone: string };

const pad = ({ value }: { value: number }) => String(value).padStart(2, "0");

/** The due time's day, midnight to midnight, as form values; empty without a due time. */
export function defaultWindow({ dueAt, timeZone }: DefaultWindowInput) {
  if (!dueAt) return { startsAt: "", endsAt: "" };
  const day = toLocalInputValue({ date: dueAt, timeZone }).slice(0, 10);
  const [year = 0, month = 1, date = 1] = day.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, date + 1));
  const nextDay = `${next.getUTCFullYear()}-${pad({ value: next.getUTCMonth() + 1 })}-${pad({ value: next.getUTCDate() })}`;
  return { startsAt: `${day}T00:00`, endsAt: `${nextDay}T00:00` };
}

export type RoomValuesInput = { room: TaskRoomView; timeZone: string };

/** A room on the page as form values. */
export function roomValuesOf({ room, timeZone }: RoomValuesInput): TaskRoomValues {
  const local = ({ date }: { date: Date | null }) =>
    date ? toLocalInputValue({ date, timeZone }) : "";
  return {
    itemId: room.itemId,
    hold: room.hold,
    startsAt: local({ date: room.startsAt }),
    endsAt: local({ date: room.endsAt }),
  };
}

export type ItemInputOf = { room: TaskRoomValues; timeZone: string };

/** Form values as one `items` entry; a related room has no window. */
export function toItemInput({ room, timeZone }: ItemInputOf): TaskItemInput {
  if (room.hold === "RELATED") return { itemId: room.itemId, hold: room.hold };
  return {
    itemId: room.itemId,
    hold: room.hold,
    startsAt: fromLocalInputValue({ value: room.startsAt, timeZone }) ?? null,
    endsAt: fromLocalInputValue({ value: room.endsAt, timeZone }) ?? null,
  };
}

/** A room as it stands on the task, for the whole `items` set a save sends. */
export function keptItemInput({ room }: { room: TaskRoomView }): TaskItemInput {
  return room.hold === "RELATED"
    ? { itemId: room.itemId, hold: room.hold }
    : { itemId: room.itemId, hold: room.hold, startsAt: room.startsAt, endsAt: room.endsAt };
}

export type ReplaceRoomInput = {
  rooms: readonly TaskRoomView[];
  /** The `TaskItem` id being edited; null adds the room. */
  editing: string | null;
  next: TaskItemInput;
};

/** The whole set after adding `next` or replacing the room being edited. */
export function roomsWith({ rooms, editing, next }: ReplaceRoomInput): TaskItemInput[] {
  const kept = rooms.map((room) => (room.id === editing ? next : keptItemInput({ room })));
  return editing === null ? [...kept, next] : kept;
}

/** The whole set without one room. */
export function roomsWithout({
  rooms,
  id,
}: {
  rooms: readonly TaskRoomView[];
  id: string;
}): TaskItemInput[] {
  return rooms.filter((room) => room.id !== id).map((room) => keptItemInput({ room }));
}
