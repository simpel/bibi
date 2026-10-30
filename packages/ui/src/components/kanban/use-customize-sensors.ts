import {
  type KeyboardCoordinateGetter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useId } from "react";
import { readDragData } from "./kanban-customize-dnd";

type Containers = Parameters<KeyboardCoordinateGetter>[1]["context"]["droppableContainers"];

type SameKindInput = { containers: Containers; kind: string | undefined };

/**
 * The droppables of the dragged kind only (columns for a column, chips and lists for a chip), so
 * the arrow keys step from column to column instead of onto a chip inside the next column. A view
 * over dnd-kit's map: `getEnabled` filters, everything else reads the real map.
 */
function sameKind({ containers, kind }: SameKindInput): Containers {
  const wanted = kind === "phase" ? ["phase"] : ["chip", "chips"];
  const view = Object.create(containers) as Containers;
  view.getEnabled = () =>
    containers
      .getEnabled()
      .filter((entry) => wanted.includes(readDragData({ data: entry.data.current })?.type ?? ""));
  view.get = (id) => containers.get(id);
  return view;
}

/** Pointer (after 5 px) and keyboard sensors for customize mode, plus a stable context id. */
export function useCustomizeSensors() {
  // A stable id: dnd-kit's own counter differs between server and client (hydration mismatch).
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event, args) => {
        const kind = readDragData({ data: args.context.active?.data.current })?.type;
        const droppableContainers = sameKind({
          containers: args.context.droppableContainers,
          kind,
        });
        return sortableKeyboardCoordinates(event, {
          ...args,
          context: { ...args.context, droppableContainers },
        });
      },
    }),
  );
  return { id, sensors };
}
