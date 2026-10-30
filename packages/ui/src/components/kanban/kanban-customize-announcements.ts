import type { Announcements } from "@dnd-kit/core";
import { dropContainer, readDragData } from "./kanban-customize-dnd";
import type {
  KanbanCustomizeLabels,
  KanbanPhaseData,
  KanbanStatusChipData,
} from "./kanban-customize-types";

export type BuildCustomizeAnnouncementsInput = {
  phases: readonly KanbanPhaseData[];
  statuses: readonly KanbanStatusChipData[];
  labels: KanbanCustomizeLabels;
};

/** Screen reader announcements for moving columns and status chips in customize mode. */
export function buildCustomizeAnnouncements({
  phases,
  statuses,
  labels,
}: BuildCustomizeAnnouncementsInput): Announcements {
  const name = ({ id }: { id: string | number }) =>
    phases.find((p) => p.id === id)?.title ?? statuses.find((s) => s.id === id)?.title ?? "";
  const target = ({ data }: { data: unknown }) => {
    const container = dropContainer({ over: data });
    if (container === undefined) return "";
    return container === null
      ? labels.unphased
      : (phases.find((p) => p.id === container)?.title ?? "");
  };
  return {
    onDragStart: ({ active }) => labels.pickedUp(name({ id: active.id })),
    onDragOver: ({ active, over }) =>
      over && readDragData({ data: over.data.current })
        ? labels.movedOver(name({ id: active.id }), target({ data: over.data.current }))
        : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? labels.dropped(name({ id: active.id }), target({ data: over.data.current }))
        : labels.cancelled(name({ id: active.id })),
    onDragCancel: ({ active }) => labels.cancelled(name({ id: active.id })),
  };
}
