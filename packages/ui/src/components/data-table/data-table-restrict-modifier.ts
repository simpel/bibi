import type { Modifier } from "@dnd-kit/core";

/**
 * Keeps a dragged column header inside the span of the movable headers: it cannot be dragged
 * over the pinned checkbox or actions columns, or past the table's edge. Offsets are measured
 * from layout (not from bounding boxes) so the siblings' drag transforms do not move the limits.
 */
export const restrictToMovableColumns: Modifier = ({ activatorEvent, transform }) => {
  const target = activatorEvent?.target;
  // dnd-kit also runs modifiers while rendering on the server, where there is no `Element`.
  if (typeof Element === "undefined" || !(target instanceof Element)) return transform;
  const dragged = target.closest<HTMLElement>("th");
  const movable = [
    ...(dragged?.closest("tr")?.querySelectorAll<HTMLElement>("th:not([data-column-pinned])") ??
      []),
  ];
  const first = movable[0];
  const last = movable.at(-1);
  if (!dragged || !first || !last) return transform;
  const min = first.offsetLeft - dragged.offsetLeft;
  const max = last.offsetLeft + last.offsetWidth - (dragged.offsetLeft + dragged.offsetWidth);
  return { ...transform, x: Math.min(Math.max(transform.x, min), max) };
};
