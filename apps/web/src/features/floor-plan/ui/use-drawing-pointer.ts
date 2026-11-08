import { type PointerEvent, type RefObject, useRef, useState } from "react";
import type { DraftElement } from "../lib/draft";
import type { LayoutDraft } from "./use-layout-draft";

export type Box = { x: number; y: number; width: number; height: number };

type Drag =
  | {
      mode: "move";
      x0: number;
      y0: number;
      before: DraftElement[];
      keys: ReadonlySet<string>;
      moved: boolean;
    }
  | { mode: "box"; x0: number; y0: number; base: readonly string[] };

const snap = ({ value, free }: { value: number; free: boolean }) =>
  free ? Math.round(value) : Math.round(value / 10) * 10;

/** A screen point in the drawing's centimetres. */
export function toDrawing({
  svg,
  clientX,
  clientY,
}: {
  svg: SVGSVGElement;
  clientX: number;
  clientY: number;
}) {
  const matrix = svg.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };
  const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
  return { x: point.x, y: point.y };
}

export type UseDrawingPointerInput = { svg: RefObject<SVGSVGElement | null>; draft: LayoutDraft };

/**
 * Pointer handling on the drawing: drag pieces (10 cm snap, Alt for free), Shift-click to add to
 * the selection, drag on the floor for a selection box. One undo step per drag.
 */
export function useDrawingPointer({ svg, draft }: UseDrawingPointerInput) {
  const drag = useRef<Drag | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [dragging, setDragging] = useState(false);
  const { state, dispatch } = draft;

  const down = ({ event }: { event: PointerEvent<SVGSVGElement> }) => {
    if (!svg.current || event.button !== 0) return;
    const { x, y } = toDrawing({
      svg: svg.current,
      clientX: event.clientX,
      clientY: event.clientY,
    });
    const key = (event.target as Element).closest("[data-id]")?.getAttribute("data-id");
    svg.current.setPointerCapture(event.pointerId);
    if (key) {
      const selected = state.selected.has(key);
      const keys = event.shiftKey
        ? selected
          ? [...state.selected].filter((k) => k !== key)
          : [...state.selected, key]
        : selected
          ? [...state.selected]
          : [key];
      dispatch({ type: "select", keys });
      drag.current = {
        mode: "move",
        x0: x,
        y0: y,
        before: state.elements,
        keys: new Set(keys),
        moved: false,
      };
      return;
    }
    const base = event.shiftKey ? [...state.selected] : [];
    if (!event.shiftKey) dispatch({ type: "select", keys: [] });
    drag.current = { mode: "box", x0: x, y0: y, base };
  };

  const move = ({ event }: { event: PointerEvent<SVGSVGElement> }) => {
    const current = drag.current;
    if (!current || !svg.current) return;
    const { x, y } = toDrawing({
      svg: svg.current,
      clientX: event.clientX,
      clientY: event.clientY,
    });
    if (current.mode === "move") {
      const dx = x - current.x0;
      const dy = y - current.y0;
      if (!current.moved && Math.hypot(dx, dy) < 3) return;
      if (!current.moved) setDragging(true);
      current.moved = true;
      const elements = current.before.map((element) =>
        current.keys.has(element.key)
          ? {
              ...element,
              xCm: snap({ value: element.xCm + dx, free: event.altKey }),
              yCm: snap({ value: element.yCm + dy, free: event.altKey }),
            }
          : element,
      );
      dispatch({ type: "preview", elements });
      return;
    }
    const next = {
      x: Math.min(current.x0, x),
      y: Math.min(current.y0, y),
      width: Math.abs(x - current.x0),
      height: Math.abs(y - current.y0),
    };
    setBox(next);
    const inside = state.elements.filter(
      (e) =>
        e.xCm >= next.x &&
        e.xCm <= next.x + next.width &&
        e.yCm >= next.y &&
        e.yCm <= next.y + next.height,
    );
    dispatch({
      type: "select",
      keys: [...new Set([...current.base, ...inside.map((e) => e.key)])],
    });
  };

  const onPointerUp = () => {
    const current = drag.current;
    drag.current = null;
    setBox(null);
    setDragging(false);
    if (current?.mode === "move" && current.moved)
      dispatch({ type: "commit", before: current.before });
  };

  return {
    box,
    dragging,
    handlers: {
      onPointerDown: (event: PointerEvent<SVGSVGElement>) => down({ event }),
      onPointerMove: (event: PointerEvent<SVGSVGElement>) => move({ event }),
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}
