import { useReducer } from "react";
import type { DraftElement } from "../lib/draft";
import type { Outline } from "../lib/outline-edit";

/** What one undo step restores: the pieces and the walls. */
export type DraftSnapshot = { elements: DraftElement[]; outline: Outline };

type State = DraftSnapshot & {
  undo: DraftSnapshot[];
  redo: DraftSnapshot[];
  selected: ReadonlySet<string>;
  dirty: boolean;
};

type Action =
  | { type: "set"; elements?: DraftElement[]; outline?: Outline; select?: readonly string[] }
  /** A live change while dragging: not an undo step until `commit`. */
  | { type: "preview"; elements?: DraftElement[]; outline?: Outline }
  | { type: "commit"; before: DraftSnapshot }
  | { type: "select"; keys: readonly string[] }
  | { type: "undo" }
  | { type: "redo" };

const snapshot = ({ state }: { state: State }): DraftSnapshot => ({
  elements: state.elements,
  outline: state.outline,
});

/** Applied to every change of pieces or walls, e.g. doors kept on a wall. */
export type Normalize = (snapshot: DraftSnapshot) => DraftElement[];

type ReduceInput = { state: State; action: Action; normalize?: Normalize };

/** The next pieces and walls of a change, normalized. */
const next = ({
  state,
  action,
  normalize,
}: ReduceInput & { action: { elements?: DraftElement[]; outline?: Outline } }) => {
  const outline = action.outline ?? state.outline;
  const elements = action.elements ?? state.elements;
  return { outline, elements: normalize ? normalize({ elements, outline }) : elements };
};

function reduce({ state, action, normalize }: ReduceInput): State {
  switch (action.type) {
    case "set":
      return {
        ...state,
        ...next({ state, action, normalize }),
        undo: [...state.undo, snapshot({ state })],
        redo: [],
        selected: action.select ? new Set(action.select) : state.selected,
        dirty: true,
      };
    case "preview":
      return { ...state, ...next({ state, action, normalize }) };
    case "commit":
      return { ...state, undo: [...state.undo, action.before], redo: [], dirty: true };
    case "select":
      return { ...state, selected: new Set(action.keys) };
    case "undo": {
      const previous = state.undo.at(-1);
      if (!previous) return state;
      return {
        ...state,
        ...previous,
        undo: state.undo.slice(0, -1),
        redo: [...state.redo, snapshot({ state })],
        selected: new Set(),
        dirty: true,
      };
    }
    case "redo": {
      const next = state.redo.at(-1);
      if (!next) return state;
      return {
        ...state,
        ...next,
        redo: state.redo.slice(0, -1),
        undo: [...state.undo, snapshot({ state })],
        selected: new Set(),
        dirty: true,
      };
    }
  }
}

export type UseLayoutDraftInput = {
  initial: DraftElement[];
  outline: Outline;
  normalize?: Normalize;
};

/** The pieces and walls being edited with undo and redo, the selection and unsaved state. */
export function useLayoutDraft({ initial, outline, normalize }: UseLayoutDraftInput) {
  const [state, dispatch] = useReducer(
    (state: State, action: Action) => reduce({ state, action, normalize }),
    {
      elements: initial,
      outline,
      undo: [],
      redo: [],
      selected: new Set<string>(),
      dirty: false,
    },
  );
  return { state, dispatch };
}

export type LayoutDraft = ReturnType<typeof useLayoutDraft>;
