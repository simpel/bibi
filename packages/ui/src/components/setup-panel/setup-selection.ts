"use client";

import { createContext, type ReactNode, useContext } from "react";

/** What a staff member can point at in the setup panel. */
export type SetupTargetKind = "itemType" | "phase";

export type SetupTarget = { kind: SetupTargetKind; name: string };

export type SetupSelection = {
  /** The element whose comment box is open, or `null`. */
  selected: SetupTarget | null;
  onSelect: (input: { target: SetupTarget | null }) => void;
  /** The comment box shown next to the selected element; `close` deselects it. */
  renderComment: (input: { target: SetupTarget; close: () => void }) => ReactNode;
};

export const SetupSelectionContext = createContext<SetupSelection | null>(null);

/** The panel's selection, or `null` when the panel is read-only. */
export function useSetupSelection(): SetupSelection | null {
  return useContext(SetupSelectionContext);
}

export function isSameTarget({ a, b }: { a: SetupTarget | null; b: SetupTarget }): boolean {
  return a?.kind === b.kind && a.name === b.name;
}
