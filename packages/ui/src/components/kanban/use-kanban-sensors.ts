import { KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useId } from "react";

/**
 * Pointer (after 5 px, so clicks still work) and keyboard sensors, plus a stable context id:
 * dnd-kit's own counter differs between server and client (hydration mismatch).
 */
export function useKanbanSensors() {
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  return { id, sensors };
}
