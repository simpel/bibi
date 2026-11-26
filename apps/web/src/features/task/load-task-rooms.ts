import "server-only";
import { getItem, type TaskDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { itemRoute } from "@/lib/routes";
import { getDateTimeFormat } from "@/server/date-time-format";
import { loadPickerItems } from "@/server/load-items-for-pickers";
import { runOperation } from "@/server/run-operation";
import type { TaskRoomView } from "./lib/task-rooms";

export type LoadTaskRoomsInput = { task: Pick<TaskDto, "items"> };

/**
 * The task's rooms with their names and windows ready to show (ADR 0120). Names come from the
 * request's one picker read; a room beyond its first page is read by id. Without `item:read`
 * a room shows as "Unknown room".
 */
export async function loadTaskRooms({ task }: LoadTaskRoomsInput): Promise<TaskRoomView[]> {
  if (task.items.length === 0) return [];
  const [t, dates, picker] = await Promise.all([
    getTranslations("task.rooms"),
    getDateTimeFormat(),
    loadPickerItems(),
  ]);
  const known = new Map((picker.ok ? picker.value.items : []).map((item) => [item.id, item.name]));
  const names = await Promise.all(
    task.items.map(async ({ itemId }) => {
      const name = known.get(itemId);
      if (name) return name;
      const read = await runOperation({ operation: getItem, input: { id: itemId } });
      return read.ok ? read.value.name : t("unknown");
    }),
  );
  return task.items.map((room, index) => ({
    id: room.id,
    itemId: room.itemId,
    name: names[index] ?? t("unknown"),
    href: itemRoute({ id: room.itemId }),
    hold: room.hold,
    startsAt: room.startsAt,
    endsAt: room.endsAt,
    window:
      room.startsAt && room.endsAt
        ? dates.dateTimeRange({ start: room.startsAt, end: room.endsAt })
        : null,
  }));
}
