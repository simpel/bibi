import { useReducer } from "react";
import type { DraftElement } from "../lib/draft";

type State = {
  elements: DraftElement[];
  undo: DraftElement[][];
  redo: DraftElement[][];
  selected: ReadonlySet<string>;
  dirty: boolean;
};

type Action =
  | { type: "set"; elements: DraftElement[]; select?: readonly string[] }
  /** A live change while dragging: not an undo step until `commit`. */
  | { type: "preview"; elements: DraftElement[] }
  | { type: "commit"; before: DraftElement[] }
  | { type: "select"; keys: readonly string[] }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "saved"; elements: DraftElement[] };

function reduce({ state, action }: { state: State; action: Action }): State {
  switch (action.type) {
    case "set":
      return {
        elements: action.elements,
        undo: [...state.undo, state.elements],
        redo: [],
        selected: action.select ? new Set(action.select) : state.selected,
        dirty: true,
      };
    case "preview":
      return { ...state, elements: action.elements };
    case "commit":
      return { ...state, undo: [...state.undo, action.before], redo: [], dirty: true };
    case "select":
      return { ...state, selected: new Set(action.keys) };
    case "undo": {
      const previous = state.undo.at(-1);
      if (!previous) return state;
      const undo = state.undo.slice(0, -1);
      return {
        ...state,
        elements: previous,
        undo,
        redo: [...state.redo, state.elements],
        selected: new Set(),
        dirty: true,
      };
    }
    case "redo": {
      const next = state.redo.at(-1);
      if (!next) return state;
      const redo = state.redo.slice(0, -1);
      return {
        ...state,
        elements: next,
        redo,
        undo: [...state.undo, state.elements],
        selected: new Set(),
        dirty: true,
      };
    }
    case "saved":
      return { ...state, elements: action.elements, dirty: false };
  }
}

/** The pieces being edited with undo and redo, the selection and whether anything is unsaved. */
export function useLayoutDraft({ initial }: { initial: DraftElement[] }) {
  const [state, dispatch] = useReducer(
    (state: State, action: Action) => reduce({ state, action }),
    {
      elements: initial,
      undo: [],
      redo: [],
      selected: new Set<string>(),
      dirty: false,
    },
  );
  return { state, dispatch };
}

export type LayoutDraft = ReturnType<typeof useLayoutDraft>;
