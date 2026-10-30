import { type CollisionDetection, closestCorners, pointerWithin } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

/**
 * What a draggable or droppable of the customize board stands for. `containerId` is the column
 * (phase) id, or null for the tray of statuses that are on no column.
 */
export type CustomizeDragData =
  | { type: "phase"; phaseId: string }
  | { type: "chip"; statusId: string; containerId: string | null }
  | { type: "chips"; containerId: string | null };

const TYPES = new Set(["phase", "chip", "chips"]);

/** dnd-kit's untyped `data.current` → the customize board's data, or null. */
export function readDragData({ data }: { data: unknown }): CustomizeDragData | null {
  if (typeof data !== "object" || data === null || !("type" in data)) return null;
  return TYPES.has(String(data.type)) ? (data as CustomizeDragData) : null;
}

/** The droppable id of a column's chip list (or the tray's, for `null`). */
export function chipsDropId({ phaseId }: { phaseId: string | null }): string {
  return `kanban-chips:${phaseId ?? "tray"}`;
}

/**
 * Where a drop lands, as a container: a column id, null for the tray, `undefined` when the target
 * is not one (nothing under the pointer). Dropping a chip on a whole column counts as its list.
 */
export function dropContainer({ over }: { over: unknown }): string | null | undefined {
  const data = readDragData({ data: over });
  if (!data) return undefined;
  return data.type === "phase" ? data.phaseId : data.containerId;
}

/**
 * Collisions among the droppables of the dragged kind only: columns while a column moves, chips
 * and chip lists while a chip moves. A chip lands where the pointer is (a wide list such as the
 * tray loses on closest corners); with the keyboard, or outside every list, closest corners
 * decide. Pure rect maths, no DOM checks (SSR-safe, #296).
 */
export const customizeCollision: CollisionDetection = ({ droppableContainers, ...rest }) => {
  const kind = readDragData({ data: rest.active.data.current })?.type;
  const wanted = kind === "phase" ? ["phase"] : ["chip", "chips"];
  const ofKind = droppableContainers.filter((container) =>
    wanted.includes(readDragData({ data: container.data.current })?.type ?? ""),
  );
  if (kind !== "phase" && rest.pointerCoordinates) {
    const hits = pointerWithin({ ...rest, droppableContainers: ofKind });
    if (hits.length > 0) return hits;
  }
  return closestCorners({ ...rest, droppableContainers: ofKind });
};

export type PhaseOrderInput = { ids: readonly string[]; activeId: string; overId: string };

/** The column order after dropping `activeId` on `overId`; null when nothing changes. */
export function phaseOrderAfterDrop({ ids, activeId, overId }: PhaseOrderInput): string[] | null {
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(overId);
  if (from < 0 || to < 0 || from === to) return null;
  return arrayMove([...ids], from, to);
}
