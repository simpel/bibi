import { ticketRoute } from "@/lib/routes";
import { blockLabel, type CalendarLabels, type GridBlock } from "./calendar-grid-model";
import type { CalendarColumn } from "./calendar-layout";
import type { CalendarData } from "./load-calendar";

export type ListEntry = Pick<GridBlock, "id" | "href" | "type" | "label" | "time"> & {
  space: string;
};
export type ListDay = { key: string; label: string; entries: ListEntry[] };

export type BuildListInput = { days: CalendarColumn[]; data: CalendarData; labels: CalendarLabels };

/** The list fallback below `md`: one section per day, its blocks earliest first with the space. */
export function buildListModel({ days, data, labels }: BuildListInput): ListDay[] {
  const spaceName = new Map(data.spaces.map(({ id, name }) => [id, name]));
  const sorted = [...data.blocks].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  return days.map((day) => ({
    key: day.start.toISOString(),
    label: labels.column({ column: day }),
    entries: sorted
      .filter((block) => block.startsAt < day.end && block.endsAt > day.start)
      .map((block) => ({
        id: block.id,
        href: block.ticketId ? ticketRoute({ id: block.ticketId }) : null,
        type: block.type,
        label: blockLabel({ block, labels }),
        time: labels.time({ block }),
        space: spaceName.get(block.itemId) ?? "",
      })),
  }));
}
