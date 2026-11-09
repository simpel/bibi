import { type DraftElement, type KindMap, NO_OVERRIDES, newKey } from "../lib/draft";
import { duplicatePieces, movePieces, removePieces, rotatePieces } from "../lib/edit-pieces";
import { type Outline, outlineSize, rectangle } from "../lib/outline-edit";
import type { LayoutDraft } from "./use-layout-draft";

const rectangleOf = ({ outline }: { outline: Outline }) => rectangle(outlineSize({ outline }));

export type UseLayoutCommandsInput = {
  draft: LayoutDraft;
  kinds: KindMap;
  room: { widthCm: number; depthCm: number };
};

/** Every change the editor makes to its pieces, each one undo step. */
export function useLayoutCommands({ draft, kinds, room }: UseLayoutCommandsInput) {
  const { state, dispatch } = draft;
  const keys = state.selected;
  const set = ({ elements, select }: { elements: DraftElement[]; select?: readonly string[] }) =>
    dispatch({ type: "set", elements, select });
  return {
    add: ({ kindId, xCm, yCm }: { kindId: string; xCm?: number; yCm?: number }) => {
      const kind = kinds.get(kindId);
      if (!kind) return;
      const numbered = kind.shape === "ROUND" && kind.seats > 0;
      const label = numbered
        ? String(state.elements.filter((e) => e.kindId === kindId).length + 1)
        : null;
      const element: DraftElement = {
        ...NO_OVERRIDES,
        key: newKey(),
        kindId,
        xCm: Math.round((xCm ?? room.widthCm / 2) / 10) * 10,
        yCm: Math.round((yCm ?? room.depthCm / 2) / 10) * 10,
        rotationDeg: 0,
        label,
      };
      set({ elements: [...state.elements, element], select: [element.key] });
    },
    replace: (element: DraftElement) =>
      set({ elements: state.elements.map((e) => (e.key === element.key ? element : e)) }),
    rotate: (step: number) =>
      set({ elements: rotatePieces({ elements: state.elements, keys, step }) }),
    move: ({ dx, dy }: { dx: number; dy: number }) =>
      set({ elements: movePieces({ elements: state.elements, keys, dx, dy }) }),
    duplicate: () => {
      const copied = duplicatePieces({ elements: state.elements, keys });
      set({ elements: copied.elements, select: copied.keys });
    },
    remove: () => set({ elements: removePieces({ elements: state.elements, keys }), select: [] }),
    replaceAll: (elements: DraftElement[]) => set({ elements, select: [] }),
    select: (selected: readonly string[]) => dispatch({ type: "select", keys: selected }),
    /** The walls replaced as one undo step (a new size, a rectangle). */
    setOutline: (outline: Outline) => dispatch({ type: "set", outline }),
    rectangle: () => dispatch({ type: "set", outline: rectangleOf({ outline: state.outline }) }),
    undo: () => dispatch({ type: "undo" }),
    redo: () => dispatch({ type: "redo" }),
  };
}

export type LayoutCommands = ReturnType<typeof useLayoutCommands>;
