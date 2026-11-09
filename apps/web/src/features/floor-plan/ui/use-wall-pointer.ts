import { useRef, useState } from "react";
import { clockwise, insertCorner, moveCorner, removeCorner } from "../lib/outline-edit";
import type { DraftSnapshot, LayoutDraft } from "./use-layout-draft";

type Drag = { index: number; before: DraftSnapshot; moved: boolean };

export type WallPoint = { x: number; y: number; free: boolean };

const snap = ({ x, y, free }: WallPoint) =>
  free ? { x, y } : { x: Math.round(x / 10) * 10, y: Math.round(y / 10) * 10 };

/**
 * Editing the walls on the floor plan: drag a corner, press a wall's + to add a corner there and
 * drag it, double-click a corner (or select it and press Delete) to delete it. One undo step per
 * drag; a move that would make walls cross is ignored.
 */
export function useWallPointer({ draft }: { draft: LayoutDraft }) {
  const { state, dispatch } = draft;
  const drag = useRef<Drag | null>(null);
  const [corner, setCorner] = useState<number | null>(null);

  /** Starts a drag when the target is a corner or a wall's +; false lets pieces handle it. */
  const down = ({ target, point }: { target: Element; point: WallPoint }) => {
    const handle = target.closest("[data-corner], [data-wall]");
    if (!handle) {
      setCorner(null);
      return false;
    }
    const before = { elements: state.elements, outline: state.outline };
    const cornerIndex = handle.getAttribute("data-corner");
    if (cornerIndex !== null) {
      const index = Number(cornerIndex);
      setCorner(index);
      drag.current = { index, before, moved: false };
      return true;
    }
    const after = Number(handle.getAttribute("data-wall"));
    const { x, y } = snap(point);
    const outline = insertCorner({ outline: state.outline, after, x, y });
    if (!outline) return true;
    dispatch({ type: "preview", outline });
    setCorner(after + 1);
    drag.current = { index: after + 1, before, moved: true };
    return true;
  };

  const move = ({ point }: { point: WallPoint }) => {
    const current = drag.current;
    if (!current) return false;
    const { x, y } = snap(point);
    const outline = moveCorner({ outline: state.outline, index: current.index, x, y });
    if (outline) {
      current.moved = true;
      dispatch({ type: "preview", outline });
    }
    return true;
  };

  const up = () => {
    const current = drag.current;
    drag.current = null;
    if (!current?.moved) return;
    const outline = clockwise({ outline: state.outline });
    if (outline !== state.outline) setCorner(null);
    dispatch({ type: "preview", outline });
    dispatch({ type: "commit", before: current.before });
  };

  const remove = ({ index }: { index: number }) => {
    const outline = removeCorner({ outline: state.outline, index });
    if (!outline) return false;
    dispatch({ type: "set", outline });
    setCorner(null);
    return true;
  };

  const onDoubleClick = ({ target }: { target: Element }) => {
    const index = target.closest("[data-corner]")?.getAttribute("data-corner");
    if (index != null) remove({ index: Number(index) });
  };

  return {
    corner,
    down,
    move,
    up,
    onDoubleClick,
    removeSelected: corner === null ? null : () => remove({ index: corner }),
  };
}

export type WallPointer = ReturnType<typeof useWallPointer>;
